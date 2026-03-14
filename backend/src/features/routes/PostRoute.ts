import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putRoute, userId } from '../../repository.ts';
import { created, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  fromStation: z.string().min(1),
  toStation: z.string().min(1),
  departureTime: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const routeId = crypto.randomUUID();
    await putRoute(uid, { routeId, ...body.data });
    return created({ routeId, ...body.data });
  } catch (error) {
    return internalServerError(error);
  }
};
