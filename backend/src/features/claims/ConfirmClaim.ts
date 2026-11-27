import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import {
  userId,
  getDelay,
  putClaim,
  reserveDelayForClaim,
  releaseClaimReservation,
  ClaimConflictError,
} from '../../repository.ts';
import { confirmClaim } from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, notFound, conflict, structuredError } from '../../utils/response.ts';

const schema = z.object({
  claimToken: z.string().min(1),
  barId: z.string().min(1),
  delayId: z.string().min(1),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimToken, barId, delayId } = body.data;

    const delay = await getDelay(uid, delayId);
    if (!delay) return notFound('Delay not found');
    if (delay.claimed) return conflict('Already claimed');

    // Reserve the delay before talking to SJ so a double tap cannot file twice.
    await reserveDelayForClaim(uid, delayId);

    let confirmationId: string;
    try {
      confirmationId = await confirmClaim(claimToken, barId);
    } catch (err) {
      await releaseClaimReservation(uid, delayId).catch((releaseErr) =>
        console.error('[ConfirmClaim] Failed to release reservation:', releaseErr),
      );
      throw err;
    }

    const claimId = crypto.randomUUID();
    const now = new Date().toISOString();

    await putClaim(
      uid,
      {
        claimId,
        delayId,
        fromStation: delay.fromStation,
        toStation: delay.toStation,
        date: delay.date,
        scheduledDeparture: delay.scheduledDeparture,
        delayMinutes: delay.delayMinutes,
        estimatedCompensation: delay.estimatedCompensation,
        status: 'submitted',
        submittedAt: now,
      },
      { sjConfirmationId: confirmationId },
    );

    return success({
      claimId,
      confirmationId,
      status: 'submitted',
      submittedAt: now,
    });
  } catch (error) {
    if (error instanceof ClaimConflictError) return conflict(error.message);
    console.error('[ConfirmClaim] Error:', error);
    return structuredError(error);
  }
};
