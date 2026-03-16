import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deletePushSubscription, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    
    if (!event.body) {
      return badRequest('Request body is required');
    }

    const body = JSON.parse(event.body) as { endpoint: string };

    if (!body.endpoint) {
      return badRequest('Endpoint is required');
    }

    await deletePushSubscription(uid, body.endpoint);

    return success({ unsubscribed: true });
  } catch (error) {
    console.error('[UnsubscribePush] Error:', error);
    return internalServerError(error);
  }
};
