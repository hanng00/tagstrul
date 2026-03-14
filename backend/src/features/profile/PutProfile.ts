import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putProfile, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  personalNumber: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  movingoId: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    await putProfile(uid, body.data);
    return success(body.data);
  } catch (error) {
    return internalServerError(error);
  }
};
