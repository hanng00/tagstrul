import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteRoute, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const routeId = event.pathParameters?.routeId;
    if (!routeId) return badRequest('routeId is required');

    await deleteRoute(uid, routeId);
    return success({ deleted: true });
  } catch (error) {
    return internalServerError(error);
  }
};
