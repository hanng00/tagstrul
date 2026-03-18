import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, getProfile, putProfile } from '../../repository.ts';
import { submitContactInfo } from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, structuredError } from '../../utils/response.ts';

const schema = z.object({
  claimToken: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimToken, firstName, lastName, email, phone } = body.data;

    const updatedToken = await submitContactInfo(claimToken, {
      emailAddress: email,
      mobilePhoneNumber: phone,
      personName: { firstName, lastName },
    });

    const profile = await getProfile(uid);

    // Save contact info to profile for future claims
    await putProfile(uid, {
      ...profile,
      firstName,
      lastName,
      email,
      phone,
    });

    return success({
      claimToken: updatedToken,
      step: 'bank',
      bank: {
        personalNumber: profile?.personalNumber ?? '',
        swishPhone: profile?.swishPhone ?? profile?.phone ?? phone,
      },
    });
  } catch (error) {
    console.error('[SubmitContact] Error:', error);
    return structuredError(error);
  }
};
