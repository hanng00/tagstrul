import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userId, dismissDelay } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const delayId = event.pathParameters?.delayId;
    
    if (!delayId) {
      return badRequest('Missing delayId');
    }

    await dismissDelay(uid, delayId);

    return success({ delayId, dismissed: true });
  } catch (error) {
    console.error('[DismissDelay] Error:', error);
    return internalServerError(error);
  }
};
