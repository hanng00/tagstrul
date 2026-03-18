import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { success, badRequest, internalServerError } from '../../utils/response.ts';
import { randomUUID } from 'crypto';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

const schema = z.object({
  message: z.string().min(1).max(2000),
  email: z.string().email().optional(),
  source: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const feedbackId = randomUUID();
    const now = new Date().toISOString();

    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: 'FEEDBACK',
          SK: `FEEDBACK#${now}#${feedbackId}`,
          feedbackId,
          message: body.data.message,
          email: body.data.email,
          source: body.data.source || 'unknown',
          createdAt: now,
          userAgent: event.headers['User-Agent'] || event.headers['user-agent'],
        },
      })
    );

    return success({ success: true, feedbackId });
  } catch (error) {
    return internalServerError(error);
  }
};
