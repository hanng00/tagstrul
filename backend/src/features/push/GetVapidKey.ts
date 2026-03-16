import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success } from '../../utils/response.ts';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;

export const handler = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return success({ publicKey: VAPID_PUBLIC_KEY });
};
