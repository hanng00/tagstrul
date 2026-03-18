import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { userId, undismissDelay } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const delayId = event.pathParameters?.delayId;
    
    if (!delayId) {
      return badRequest('Missing delayId');
    }

    await undismissDelay(uid, delayId);

    return success({ delayId, dismissed: false });
  } catch (error) {
    console.error('[UndismissDelay] Error:', error);
    return internalServerError(error);
  }
};
