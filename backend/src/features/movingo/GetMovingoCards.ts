import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getMovingoCards, userId } from '../../repository.ts';
import { success, internalServerError } from '../../utils/response.ts';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const cards = await getMovingoCards(uid);
    return success(cards);
  } catch (err) {
    console.error(err);
    return internalServerError(err);
  }
};
