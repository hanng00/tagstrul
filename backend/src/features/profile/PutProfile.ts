import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putProfile, getProfile, userId, userEmail } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  personalNumber: z.string().optional(),
  phone: z.string().optional(),
  onboardingComplete: z.boolean().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const email = userEmail(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const existing = await getProfile(uid) ?? {};
    const updated = { ...existing, ...body.data, email };

    await putProfile(uid, updated);
    return success(updated);
  } catch (error) {
    return internalServerError(error);
  }
};
