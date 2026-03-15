import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import { userId, getDelay, putClaim } from '../../repository.ts';
import { confirmClaim } from '../../adapter/SJDelayCompensationAdapter.ts';
import { success, badRequest, notFound, internalServerError } from '../../utils/response.ts';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

const schema = z.object({
  claimToken: z.string().min(1),
  barId: z.string().min(1),
  delayId: z.string().min(1),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const uid = userId(event as any);
    const body = schema.safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) return badRequest(body.error.message);

    const { claimToken, barId, delayId } = body.data;

    const delay = await getDelay(uid, delayId);
    if (!delay) return notFound('Delay not found');
    if (delay.claimed) return badRequest('Already claimed');

    const confirmationId = await confirmClaim(claimToken, barId);

    const claimId = crypto.randomUUID();
    const now = new Date().toISOString();

    await putClaim(uid, {
      claimId,
      delayId,
      fromStation: delay.fromStation,
      toStation: delay.toStation,
      date: delay.date,
      scheduledDeparture: delay.scheduledDeparture,
      delayMinutes: delay.delayMinutes,
      estimatedCompensation: delay.estimatedCompensation,
      status: 'submitted',
      submittedAt: now,
    });

    await client.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
        UpdateExpression: 'SET claimed = :claimed, claimId = :claimId, sjConfirmationId = :confirmationId',
        ExpressionAttributeValues: {
          ':claimed': true,
          ':claimId': claimId,
          ':confirmationId': confirmationId,
        },
      }),
    );

    return success({
      claimId,
      confirmationId,
      status: 'submitted',
      submittedAt: now,
    });
  } catch (error) {
    console.error('[ConfirmClaim] Error:', error);
    return internalServerError(error);
  }
};
