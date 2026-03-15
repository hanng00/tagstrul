import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId } from '../../repository.ts';
import { getDelay, getProfile, getMovingoCards } from '../../repository.ts';
import {
  getDelayCompensationToken,
  submitTravelDetails,
  MOVINGO_CARD_TYPE_LABELS,
} from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, notFound, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  delayId: z.string().min(1),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const delay = await getDelay(uid, body.data.delayId);
    if (!delay) return notFound('Delay not found');
    if (delay.claimed) return badRequest('Already claimed');
    if (!delay.claimable) return badRequest('Not claimable');

    const [profile, movingoCards] = await Promise.all([
      getProfile(uid),
      getMovingoCards(uid),
    ]);

    const activeCard = movingoCards.find((c) => c.expiryDate >= new Date().toISOString().slice(0, 10));
    if (!activeCard) {
      return badRequest('No active Movingo card');
    }

    const cardTypeLabel = MOVINGO_CARD_TYPE_LABELS[activeCard.cardType] ?? 'Movingo 30 dgr på SJ kort';

    const token = await getDelayCompensationToken(activeCard.movingoId, cardTypeLabel);

    const trainId = delay.trainId ?? extractTrainId(delay.delayId);

    const { token: updatedToken, ticketCompensation } = await submitTravelDetails(token, {
      journeyDetail: {
        departureLocation: {
          id: delay.fromStationUic ?? '',
          name: delay.fromStation,
        },
        arrivalLocation: {
          id: delay.toStationUic ?? '',
          name: delay.toStation,
        },
        journeyDate: { date: delay.date },
        journeyTime: { time: delay.scheduledDeparture },
        trainNumber: trainId,
      },
      expenses: [],
    });

    if (!ticketCompensation) {
      return badRequest('SJ indicates this trip is not eligible for compensation');
    }

    return success({
      claimToken: updatedToken,
      step: 'contact',
      delay: {
        delayId: delay.delayId,
        fromStation: delay.fromStation,
        toStation: delay.toStation,
        date: delay.date,
        scheduledDeparture: delay.scheduledDeparture,
        delayMinutes: delay.delayMinutes,
        cancelled: delay.cancelled,
        estimatedCompensation: delay.estimatedCompensation,
      },
      contact: {
        firstName: profile?.firstName ?? '',
        lastName: profile?.lastName ?? '',
        email: profile?.email ?? '',
        phone: profile?.phone ?? '',
      },
    });
  } catch (error) {
    console.error('[StartClaim] Error:', error);
    return internalServerError(error);
  }
};

function extractTrainId(delayId: string): string {
  const parts = delayId.split('_');
  return parts[parts.length - 1] ?? '';
}
