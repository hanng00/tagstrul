import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDelays, userId } from '../../repository.ts';
import { success, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const delays = await getDelays(uid);
    return success(delays);
  } catch (error) {
    return internalServerError(error);
  }
};
