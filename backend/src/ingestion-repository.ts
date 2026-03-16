import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { UserRoute, UserDelayMatch } from './features/ingestion/UserRouteMatcher.ts';
import type { TrainDeparture } from './adapter/TrainDataPort.ts';
import type { MovingoCard } from './features/ingestion/CompensationCalculator.ts';

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

import type { StationPair } from './adapter/TrainDataPort.ts';

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
          SK: `DEP#${d.fromStation}#${d.scheduledDeparture}#${d.trainId}`,
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
    await client.send(new BatchWriteCommand({ RequestItems: { [TABLE]: batch } }));
  }
}

export async function writeUserDelays(matches: UserDelayMatch[]): Promise<void> {
  const now = new Date();
  const claimDeadline = new Date(now);
  claimDeadline.setDate(claimDeadline.getDate() + 30);
  const deadlineStr = claimDeadline.toISOString().slice(0, 10);
  const firstSeenAt = now.toISOString();

  for (const m of matches) {
    const delayId = `${m.delay.date}_${m.delay.trainId}_${m.fromStationUic}_${m.toStationUic}`;

    try {
      // Only insert if delay doesn't exist yet (idempotent write)
      await client.send(
        new PutCommand({
          TableName: TABLE,
          Item: {
            PK: `USER#${m.userId}`,
            SK: `DELAY#${delayId}`,
            trainId: m.delay.trainId,
            routeId: m.routeId,
            fromStation: m.delay.fromStation,
            fromStationUic: m.fromStationUic,
            toStation: m.delay.toStation,
            toStationUic: m.toStationUic,
            date: m.delay.date,
            scheduledDeparture: m.delay.scheduledDeparture,
            actualDeparture: m.delay.actualDeparture,
            delayMinutes: m.delay.delayMinutes,
            cancelled: m.delay.cancelled,
            estimatedCompensation: m.estimatedCompensation,
            claimable: m.claimable,
            claimed: false,
            claimDeadline: m.claimable ? deadlineStr : undefined,
            source: m.delay.source,
            trainDataRef: m.delay.rawRef,
            detectedAt: now.toISOString(),
            // New fields for 72-hour rule
            announcedAt: m.delay.announcedAt,
            disruptionReason: m.delay.disruptionReason,
            likelyScheduledChange: m.likelyScheduledChange,
            firstSeenAt,
          },
          ConditionExpression: 'attribute_not_exists(PK)',
        }),
      );
    } catch (err: unknown) {
      // ConditionalCheckFailedException means delay already exists - skip silently
      if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
        continue;
      }
      throw err;
    }
  }
}
