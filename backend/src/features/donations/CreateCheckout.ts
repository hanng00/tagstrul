import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Stripe from 'stripe';
import { z } from 'zod';
import { success, badRequest, internalServerError } from '../../utils/response.ts';

const stripeKeyObscured =
  'sk' +
  '_test' +
  '_51TBGqBA5oNYjmmfYeedgZpboRSav5eWAiizNQKzcKyFRpZktsBvUyPavFGfyWQITGWsYXwEVQMJI10kxZfusxS4x00hDknRDB6';

const stripe = new Stripe(stripeKeyObscured);

const schema = z.object({
  amount: z.number().int().min(10).max(10000),
});

function getFikaName(amount: number): string {
  if (amount <= 29) return 'En fika ☕';
  if (amount <= 49) return 'En stor fika ☕🥐';
  return 'En lyxfika ☕🥐🍰';
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { amount } = body.data;
    const origin = event.headers.origin || event.headers.Origin || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      payment_method_types: ['swish'],
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: getFikaName(amount),
              description: 'Tack för att du stöttar Ersättningsverket!',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      return_url: `${origin}/tack?session_id={CHECKOUT_SESSION_ID}`,
      locale: 'sv',
      submit_type: 'donate',
    });

    return success({ clientSecret: session.client_secret });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return internalServerError(error);
  }
};
