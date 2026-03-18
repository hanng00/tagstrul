import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, putProfile, getProfile } from '../../repository.ts';
import { submitBankDetails } from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, structuredError } from '../../utils/response.ts';

const schema = z.object({
  claimToken: z.string().min(1),
  personalNumber: z.string().min(10).max(13),
  swishPhone: z.string().min(10),
});

function formatPersonalNumber(pnr: string): string {
  const digits = pnr.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  return pnr;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimToken, personalNumber, swishPhone } = body.data;
    const formattedPnr = formatPersonalNumber(personalNumber);

    const barId = await submitBankDetails(claimToken, {
      personalIdentityNumber: formattedPnr,
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
    return structuredError(error);
  }
};
