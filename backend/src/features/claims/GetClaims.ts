import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getClaims, userId } from '../../repository.ts';
import { success, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const claims = await getClaims(uid);
    return success(claims);
  } catch (error) {
    return internalServerError(error);
  }
};
