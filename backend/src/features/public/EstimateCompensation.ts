import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { createTrainDataAdapter } from '../../adapter/TrainDataPort.ts';
import { detectDelays } from '../ingestion/DelayDetector.ts';
import { compensationTier, isClaimable, type MovingoCard } from '../ingestion/CompensationCalculator.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';
import { getStationByName } from '../../data/stations.ts';

const PRICIEST_MOVINGO: MovingoCard = {
  cardId: 'estimate',
  cardType: 'movingo-year',
  price: 27900,
  purchaseDate: '2025-01-08',
  expiryDate: '2026-01-08',
};

const TRAVEL_DAYS = 365;
const AVG_TRIP_PRICE = PRICIEST_MOVINGO.price / TRAVEL_DAYS;

const schema = z.object({
  fromStation: z.string().min(1),
  toStation: z.string().min(1),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const fromStation = getStationByName(body.data.fromStation);
    const toStation = getStationByName(body.data.toStation);

    if (!fromStation) return badRequest(`Unknown station: ${body.data.fromStation}`);
    if (!toStation) return badRequest(`Unknown station: ${body.data.toStation}`);

    const adapter = createTrainDataAdapter();
    const today = new Date();
    const dates: string[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const outbound = {
      from: fromStation.name,
      fromUic: fromStation.uic,
      to: toStation.name,
      toUic: toStation.uic,
    };

    const inbound = {
      from: toStation.name,
      fromUic: toStation.uic,
      to: fromStation.name,
      toUic: fromStation.uic,
    };

    const [outboundDepartures, inboundDepartures] = await Promise.all([
      Promise.all(dates.map((date) => adapter.fetchDepartures(outbound, date))),
      Promise.all(dates.map((date) => adapter.fetchDepartures(inbound, date))),
    ]);

    const allDepartures = [...outboundDepartures.flat(), ...inboundDepartures.flat()];

    const delays = detectDelays(allDepartures);
    const claimableDelays = delays.filter((d) => isClaimable(d.delayMinutes, d.cancelled));

    const totalCompensation = claimableDelays.reduce((sum, d) => {
      const tier = compensationTier(d.delayMinutes, d.cancelled);
      return sum + Math.round(AVG_TRIP_PRICE * tier);
    }, 0);

    return success({
      fromStation: fromStation.name,
      toStation: toStation.name,
      days: 7,
      totalDelays: delays.length,
      claimableDelays: claimableDelays.length,
      estimatedCompensation: totalCompensation,
    });
  } catch (error) {
    return internalServerError(error);
  }
};
