import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProfile, userId, userEmail } from '../../repository.ts';
import { success, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const email = userEmail(event as any);
    const profile = await getProfile(uid);
    return success(profile ?? { email, onboardingComplete: false });
  } catch (error) {
    return internalServerError(error);
  }
};
