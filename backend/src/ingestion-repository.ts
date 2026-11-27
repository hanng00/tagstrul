import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand, QueryCommand, UpdateCommand, type BatchWriteCommandInput } from '@aws-sdk/lib-dynamodb';
import { buildDelayUpsert, becameClaimable } from './features/ingestion/DelayRecord.ts';
import type { UserRoute, UserDelayMatch } from './features/ingestion/UserRouteMatcher.ts';
import type { TrainDeparture } from './domain/train.ts';
import type { MovingoCard } from './domain/compensation.ts';
import type { PushSubscription } from './types.ts';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

export async function getUserRoutes(userId: string): Promise<UserRoute[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'ROUTE#' },
    }),
  );

  return (result.Items ?? []).map((item) => ({
    userId,
    routeId: (item.SK as string).replace('ROUTE#', ''),
    fromStation: item.fromStation as string,
    fromStationUic: item.fromStationUic as string,
    toStation: item.toStation as string,
    toStationUic: item.toStationUic as string,
    departureTime: item.departureTime as string | undefined,
  }));
}

export async function getUserMovingoCard(userId: string): Promise<MovingoCard | null> {
  const today = new Date().toISOString().slice(0, 10);

  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'MOVINGO#' },
    }),
  );

  let latestCard: MovingoCard | null = null;
  for (const item of result.Items ?? []) {
    const expiry = item.expiryDate as string;
    if (expiry < today) continue;

    if (!latestCard || expiry > latestCard.expiryDate) {
      latestCard = {
        cardId: (item.SK as string).replace('MOVINGO#', ''),
        cardType: item.cardType as MovingoCard['cardType'],
        price: item.price as number,
        purchaseDate: item.purchaseDate as string,
        expiryDate: expiry,
      };
    }
  }

  return latestCard;
}

export async function getAllUserRoutes(): Promise<UserRoute[]> {
  const routes: UserRoute[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':sk': 'ROUTE#' },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of result.Items ?? []) {
      routes.push({
        userId: (item.PK as string).replace('USER#', ''),
        routeId: (item.SK as string).replace('ROUTE#', ''),
        fromStation: item.fromStation as string,
        fromStationUic: item.fromStationUic as string,
        toStation: item.toStation as string,
        toStationUic: item.toStationUic as string,
        departureTime: item.departureTime as string | undefined,
      });
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return routes;
}

export async function getActiveMovingoCards(): Promise<Map<string, MovingoCard>> {
  const cards = new Map<string, MovingoCard>();
  const today = new Date().toISOString().slice(0, 10);
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':sk': 'MOVINGO#' },
        ExclusiveStartKey: lastKey,
      }),
    );

    for (const item of result.Items ?? []) {
      const expiry = item.expiryDate as string;
      if (expiry < today) continue;

      const userId = (item.PK as string).replace('USER#', '');
      const existing = cards.get(userId);
      if (!existing || expiry > existing.expiryDate) {
        cards.set(userId, {
          cardId: (item.SK as string).replace('MOVINGO#', ''),
          cardType: item.cardType as MovingoCard['cardType'],
          price: item.price as number,
          purchaseDate: item.purchaseDate as string,
          expiryDate: expiry,
        });
      }
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return cards;
}

import type { StationPair } from './domain/train.ts';

export function uniqueRoutePairs(routes: UserRoute[]): StationPair[] {
  const seen = new Set<string>();
  const pairs: StationPair[] = [];
  for (const r of routes) {
    const forwardKey = `${r.fromStationUic}|${r.toStationUic}`;
    const reverseKey = `${r.toStationUic}|${r.fromStationUic}`;

    if (!seen.has(forwardKey)) {
      seen.add(forwardKey);
      pairs.push({
        from: r.fromStation,
        fromUic: r.fromStationUic,
        to: r.toStation,
        toUic: r.toStationUic,
      });
    }

    if (!seen.has(reverseKey)) {
      seen.add(reverseKey);
      pairs.push({
        from: r.toStation,
        fromUic: r.toStationUic,
        to: r.fromStation,
        toUic: r.fromStationUic,
      });
    }
  }
  return pairs;
}

export async function writeTrainSnapshots(departures: TrainDeparture[]): Promise<void> {
  const batches: Record<string, unknown>[][] = [];
  let current: Record<string, unknown>[] = [];

  for (const d of departures) {
    current.push({
      PutRequest: {
        Item: {
          PK: `TRAIN#${d.date}`,
          SK: `DEP#${d.fromStation}#${d.toStation}#${d.scheduledDeparture}#${d.trainId}`,
          ...d,
          fetchedAt: new Date().toISOString(),
        },
      },
    });
    if (current.length === 25) {
      batches.push(current);
      current = [];
    }
  }
  if (current.length > 0) batches.push(current);

  for (const batch of batches) {
    await batchWriteWithRetry(batch);
  }
}

/**
 * Creates or refreshes each user's delay record and returns the matches that just
 * became claimable (new records, or existing ones that crossed the claimable line).
 * Callers use the result to notify users once per delay instead of on every poll.
 */
export async function writeUserDelays(matches: UserDelayMatch[]): Promise<UserDelayMatch[]> {
  const now = new Date();
  const newlyClaimable: UserDelayMatch[] = [];

  for (const m of matches) {
    try {
      const result = await client.send(new UpdateCommand(buildDelayUpsert(TABLE, m, now)));
      if (becameClaimable(m, result.Attributes)) newlyClaimable.push(m);
    } catch (err: unknown) {
      // Condition failed: the delay is already claimed, so leave it as it is.
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') continue;
      throw err;
    }
  }

  return newlyClaimable;
}

export async function getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'PUSH#' },
    }),
  );

  return (result.Items ?? []).map((item) => ({
    endpoint: item.endpoint as string,
    keys: {
      p256dh: item.p256dh as string,
      auth: item.auth as string,
    },
  }));
}

/**
 * DynamoDB may accept only part of a batch under load and return the rest as
 * UnprocessedItems. Retry those with backoff instead of dropping them silently.
 */
async function batchWriteWithRetry(requests: NonNullable<BatchWriteCommandInput['RequestItems']>[string]): Promise<void> {
  let pending = requests;
  for (let attempt = 0; pending.length > 0; attempt++) {
    if (attempt > 0) {
      if (attempt > 5) {
        console.warn(`[ingestion] Dropping ${pending.length} unprocessed snapshot writes after retries`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
    const result = await client.send(new BatchWriteCommand({ RequestItems: { [TABLE]: pending } }));
    pending = result.UnprocessedItems?.[TABLE] ?? [];
  }
}
