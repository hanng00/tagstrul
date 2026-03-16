import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { putPushSubscription, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';
import type { PushSubscription } from '../../types.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const body = JSON.parse(event.body) as PushSubscription;

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return badRequest('Invalid push subscription: endpoint and keys required');
    }

    await putPushSubscription(uid, body);

    return success({ subscribed: true });
  } catch (error) {
    console.error('[SubscribePush] Error:', error);
    return internalServerError(error);
  }
};
