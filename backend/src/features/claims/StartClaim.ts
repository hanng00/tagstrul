import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, getDelay, getProfile, getMovingoCards } from '../../repository.ts';
import { findCardForDate } from '../../domain/movingo.ts';
import { claimProviderFor, CLAIM_PROVIDER_NAMES } from '../../domain/claims.ts';
import { claimAdapterFor } from '../../adapter/registry.ts';
import { encodeClaimToken } from './claimToken.ts';
import { success, badRequest, notFound, structuredError } from '../../utils/response.ts';

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

    const activeCard = findCardForDate(movingoCards, delay.date);
    if (!activeCard) {
      return badRequest(`No Movingo card valid on ${delay.date}`);
    }

    const provider = claimProviderFor(delay.operator);
    const claims = claimAdapterFor(provider);

    const { session, eligible } = await claims.start(
      { kind: 'movingo', cardNumber: activeCard.movingoId, cardType: activeCard.cardType },
      {
        fromStation: delay.fromStation,
        fromStationUic: delay.fromStationUic ?? '',
        toStation: delay.toStation,
        toStationUic: delay.toStationUic ?? '',
        date: delay.date,
        departureTime: delay.scheduledDeparture,
        trainNumber: delay.trainId ?? extractTrainId(delay.delayId),
      },
    );

    if (!eligible) {
      return badRequest(`${CLAIM_PROVIDER_NAMES[provider]} indicates this trip is not eligible for compensation or is already claimed`);
    }

    return success({
      claimToken: encodeClaimToken(provider, session),
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
    return structuredError(error);
  }
};

function extractTrainId(delayId: string): string {
  const parts = delayId.split('_');
  return parts[parts.length - 1] ?? '';
}
