import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deleteMovingoCard, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const cardId = event.pathParameters?.cardId;
    if (!cardId) return badRequest('Missing cardId');
    await deleteMovingoCard(uid, cardId);
    return success({ deleted: true });
  } catch (err) {
    console.error(err);
    return internalServerError(err);
  }
};
