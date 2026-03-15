import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, putProfile, getProfile } from '../../repository.ts';
import { submitBankDetails } from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const schema = z.object({
  claimToken: z.string().min(1),
  personalNumber: z.string().min(10).max(13),
  swishPhone: z.string().min(10),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimToken, personalNumber, swishPhone } = body.data;

    const barId = await submitBankDetails(claimToken, {
      personalIdentityNumber: personalNumber,
      swishPhoneNumber: swishPhone,
    });

    const profile = await getProfile(uid);
    await putProfile(uid, {
      ...profile,
      personalNumber,
      swishPhone,
    });

    return success({
      claimToken,
      barId,
      step: 'confirm',
    });
  } catch (error) {
    console.error('[SubmitBank] Error:', error);
    return internalServerError(error);
  }
};
