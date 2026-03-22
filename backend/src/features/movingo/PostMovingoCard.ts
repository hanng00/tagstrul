import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { putMovingoCard, userId } from '../../repository.ts';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const MOVINGO_ID_REGEX = /^[A-Za-z0-9]{9,10}$/;

const schema = z.object({
  movingoId: z
    .string()
    .min(9, 'Movingo-nummer måste vara 9-10 tecken')
    .max(10, 'Movingo-nummer måste vara 9-10 tecken')
    .regex(MOVINGO_ID_REGEX, 'Movingo-nummer får bara innehålla bokstäver och siffror'),
  cardType: z.enum(['movingo-30', 'movingo-90', 'movingo-year', 'movingo-5-30']),
  price: z.number().positive(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.parse(JSON.parse(event.body ?? '{}'));
    const cardId = crypto.randomUUID();
    const card = { cardId, ...body };
    await putMovingoCard(uid, card);
    return success(card);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return badRequest('Invalid request body');
    }
    console.error(err);
    return internalServerError(err);
  }
};
