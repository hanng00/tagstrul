import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, updateClaimStatus } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  claimId: z.string().min(1),
  status: z.enum(['approved', 'rejected']),
  actualCompensation: z.number().min(0).optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimId, status, actualCompensation } = body.data;

    await updateClaimStatus(uid, claimId, status, actualCompensation);

    return success({ claimId, status, actualCompensation });
  } catch (error) {
    console.error('[UpdateClaimStatus] Error:', error);
    return internalServerError(error);
  }
};
