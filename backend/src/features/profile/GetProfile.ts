import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getProfile, userId } from '../../repository.ts';
import { success, notFound, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const profile = await getProfile(uid);
    if (!profile) return notFound('Profile not found');
    return success(profile);
  } catch (error) {
    return internalServerError(error);
  }
};
