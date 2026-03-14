import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getRoutes, userId } from '../../repository.ts';
import { success, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const routes = await getRoutes(uid);
    return success(routes);
  } catch (error) {
    return internalServerError(error);
  }
};
