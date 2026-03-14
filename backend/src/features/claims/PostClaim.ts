import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putClaim, userId } from '../../repository.ts';
import { created, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  delayId: z.string().min(1),
  fromStation: z.string().min(1),
  toStation: z.string().min(1),
  date: z.string().min(1),
  scheduledDeparture: z.string().min(1),
  delayMinutes: z.number().positive(),
  estimatedCompensation: z.number().positive(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const claimId = crypto.randomUUID();
    const claim = {
      claimId,
      ...body.data,
      status: 'submitted' as const,
      submittedAt: new Date().toISOString(),
    };

    await putClaim(uid, claim);
    return created(claim);
  } catch (error) {
    return internalServerError(error);
  }
};
