import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, GetCommand, UpdateCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import type { Route, Delay, Claim, Profile, MovingoCard } from './types.ts';
import type { ClaimProviderId } from './domain/claims.ts';
import { estimateCompensation, isClaimable } from './domain/compensation.ts';
import { getUserMovingoCard } from './ingestion-repository.ts';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

function userId(event: { requestContext: { authorizer: { claims: { sub: string } } } }): string {
  return event.requestContext.authorizer.claims.sub;
}

function userEmail(event: { requestContext: { authorizer: { claims: { email?: string } } } }): string | undefined {
  return event.requestContext.authorizer.claims.email;
}

export { userId, userEmail };

export async function getRoutes(uid: string): Promise<Route[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'ROUTE#' },
    })
  );
  return (result.Items ?? []).map((item) => ({
    routeId: item.SK.replace('ROUTE#', ''),
    fromStation: item.fromStation,
    fromStationUic: item.fromStationUic,
    toStation: item.toStation,
    toStationUic: item.toStationUic,
    departureTime: item.departureTime,
  }));
}

export async function putRoute(uid: string, route: Route): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: `ROUTE#${route.routeId}`,
        fromStation: route.fromStation,
        fromStationUic: route.fromStationUic,
        toStation: route.toStation,
        toStationUic: route.toStationUic,
        departureTime: route.departureTime,
      },
    })
  );
}

export async function deleteRoute(uid: string, routeId: string): Promise<void> {
  await client.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `ROUTE#${routeId}` },
    })
  );
}

export async function getDelays(uid: string): Promise<Delay[]> {
  const [result, card] = await Promise.all([
    client.send(
      new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'DELAY#' },
      })
    ),
    getUserMovingoCard(uid),
  ]);

  return (result.Items ?? []).map((item) => {
    const delayMinutes = item.delayMinutes as number;
    const cancelled = (item.cancelled ?? false) as boolean;
    const claimable = isClaimable(delayMinutes, cancelled);
    const compensation = card && claimable
      ? estimateCompensation(delayMinutes, cancelled, card)
      : 0;

    return {
      delayId: item.SK.replace('DELAY#', ''),
      routeId: item.routeId,
      fromStation: item.fromStation,
      toStation: item.toStation,
      date: item.date,
      scheduledDeparture: item.scheduledDeparture,
      delayMinutes,
      cancelled,
      estimatedCompensation: compensation,
      claimable,
      claimed: item.claimed ?? false,
      claimDeadline: item.claimDeadline,
      dismissed: item.dismissed ?? false,
      announcedAt: item.announcedAt,
      firstSeenAt: item.firstSeenAt,
      disruptionReason: item.disruptionReason,
      operator: item.operator,
      likelyScheduledChange: item.likelyScheduledChange ?? false,
    };
  });
}

export async function getDelay(uid: string, delayId: string): Promise<(Delay & { trainId?: string; fromStationUic?: string; toStationUic?: string }) | null> {
  const [result, card] = await Promise.all([
    client.send(
      new GetCommand({
        TableName: TABLE,
        Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
      })
    ),
    getUserMovingoCard(uid),
  ]);

  if (!result.Item) return null;

  const delayMinutes = result.Item.delayMinutes as number;
  const cancelled = (result.Item.cancelled ?? false) as boolean;
  const claimable = isClaimable(delayMinutes, cancelled);
  const compensation = card && claimable
    ? estimateCompensation(delayMinutes, cancelled, card)
    : 0;

  return {
    delayId: result.Item.SK.replace('DELAY#', ''),
    routeId: result.Item.routeId,
    fromStation: result.Item.fromStation,
    toStation: result.Item.toStation,
    fromStationUic: result.Item.fromStationUic,
    toStationUic: result.Item.toStationUic,
    date: result.Item.date,
    scheduledDeparture: result.Item.scheduledDeparture,
    delayMinutes,
    cancelled,
    estimatedCompensation: compensation,
    claimable,
    claimed: result.Item.claimed ?? false,
    claimDeadline: result.Item.claimDeadline,
    trainId: result.Item.trainId,
    operator: result.Item.operator,
    announcedAt: result.Item.announcedAt,
    firstSeenAt: result.Item.firstSeenAt,
    disruptionReason: result.Item.disruptionReason,
    likelyScheduledChange: result.Item.likelyScheduledChange ?? false,
  };
}

export async function markDelayClaimed(uid: string, delayId: string): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: {
        PK: `USER#${uid}`,
        SK: `DELAY#${delayId}`,
      },
      UpdateExpression: 'SET claimed = :claimed',
      ExpressionAttributeValues: { ':claimed': true },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );
}

export async function getClaims(uid: string): Promise<Claim[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'CLAIM#' },
    })
  );
  return (result.Items ?? []).map((item) => ({
    claimId: item.SK.replace('CLAIM#', ''),
    delayId: item.delayId,
    fromStation: item.fromStation,
    toStation: item.toStation,
    date: item.date,
    scheduledDeparture: item.scheduledDeparture,
    delayMinutes: item.delayMinutes,
    estimatedCompensation: item.estimatedCompensation,
    status: item.status,
    submittedAt: item.submittedAt,
    actualCompensation: item.actualCompensation,
    resolvedAt: item.resolvedAt,
  }));
}

/** Thrown when a delay is already claimed, or another claim for it is in progress. */
export class ClaimConflictError extends Error {
  constructor(message = 'Delay is already claimed') {
    super(message);
    this.name = 'ClaimConflictError';
  }
}

/** How long a claim reservation blocks other attempts before it counts as abandoned. */
const CLAIM_RESERVATION_MS = 2 * 60 * 1000;

const NOT_CLAIMED = '(attribute_not_exists(claimed) OR claimed = :false)';

/**
 * Reserves a delay before we confirm the claim with SJ, so a double tap or a retry
 * cannot file the same claim twice. Release it with releaseClaimReservation if the
 * SJ call fails; putClaim clears it on success.
 */
export async function reserveDelayForClaim(uid: string, delayId: string): Promise<void> {
  const now = Date.now();
  try {
    await client.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
        UpdateExpression: 'SET claimStartedAt = :now',
        ConditionExpression: `attribute_exists(PK) AND ${NOT_CLAIMED} AND (attribute_not_exists(claimStartedAt) OR claimStartedAt < :staleBefore)`,
        ExpressionAttributeValues: {
          ':now': new Date(now).toISOString(),
          ':staleBefore': new Date(now - CLAIM_RESERVATION_MS).toISOString(),
          ':false': false,
        },
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name === 'ConditionalCheckFailedException') {
      throw new ClaimConflictError('Delay is already claimed or a claim is in progress');
    }
    throw err;
  }
}

export async function releaseClaimReservation(uid: string, delayId: string): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
      UpdateExpression: 'REMOVE claimStartedAt',
      ConditionExpression: 'attribute_exists(PK)',
    }),
  );
}

/**
 * Stores the claim and marks its delay as claimed in one transaction, so we never
 * end up with a claim whose delay still looks unclaimed (or two claims for one delay).
 */
export async function putClaim(
  uid: string,
  claim: Claim,
  extra: { provider?: ClaimProviderId; confirmationId?: string } = {},
): Promise<void> {
  const delayValues: Record<string, unknown> = { ':true': true, ':false': false, ':claimId': claim.claimId };
  let delaySet = 'SET claimed = :true, claimId = :claimId';
  if (extra.provider) {
    delaySet += ', claimProvider = :provider';
    delayValues[':provider'] = extra.provider;
  }
  if (extra.confirmationId) {
    // SJ confirmations keep their original attribute name so existing records and readers still line up.
    const attr = !extra.provider || extra.provider === 'sj' ? 'sjConfirmationId' : 'providerConfirmationId';
    delaySet += `, ${attr} = :confirmationId`;
    delayValues[':confirmationId'] = extra.confirmationId;
  }

  try {
    await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TABLE,
              Item: {
                PK: `USER#${uid}`,
                SK: `CLAIM#${claim.claimId}`,
                delayId: claim.delayId,
                fromStation: claim.fromStation,
                toStation: claim.toStation,
                date: claim.date,
                scheduledDeparture: claim.scheduledDeparture,
                delayMinutes: claim.delayMinutes,
                estimatedCompensation: claim.estimatedCompensation,
                status: claim.status,
                submittedAt: claim.submittedAt,
              },
            },
          },
          {
            Update: {
              TableName: TABLE,
              Key: { PK: `USER#${uid}`, SK: `DELAY#${claim.delayId}` },
              UpdateExpression: `${delaySet} REMOVE claimStartedAt`,
              ConditionExpression: `attribute_exists(PK) AND ${NOT_CLAIMED}`,
              ExpressionAttributeValues: delayValues,
            },
          },
        ],
      }),
    );
  } catch (err) {
    if ((err as { name?: string }).name === 'TransactionCanceledException') {
      throw new ClaimConflictError();
    }
    throw err;
  }
}

export async function updateClaimStatus(
  uid: string,
  claimId: string,
  status: 'approved' | 'rejected',
  actualCompensation?: number,
): Promise<void> {
  const resolvedAt = new Date().toISOString();
  
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `CLAIM#${claimId}` },
      UpdateExpression: 'SET #status = :status, resolvedAt = :resolvedAt' + 
        (actualCompensation !== undefined ? ', actualCompensation = :actualCompensation' : ''),
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':resolvedAt': resolvedAt,
        ...(actualCompensation !== undefined && { ':actualCompensation': actualCompensation }),
      },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );
}

export async function dismissDelay(uid: string, delayId: string): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
      UpdateExpression: 'SET dismissed = :dismissed',
      ExpressionAttributeValues: { ':dismissed': true },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );
}

export async function undismissDelay(uid: string, delayId: string): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
      UpdateExpression: 'SET dismissed = :dismissed',
      ExpressionAttributeValues: { ':dismissed': false },
      ConditionExpression: 'attribute_exists(PK)',
    })
  );
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: 'PROFILE' },
    })
  );
  if (!result.Item) return null;
  return {
    firstName: result.Item.firstName,
    lastName: result.Item.lastName,
    personalNumber: result.Item.personalNumber,
    email: result.Item.email,
    phone: result.Item.phone,
    swishPhone: result.Item.swishPhone,
    onboardingComplete: result.Item.onboardingComplete,
  };
}

export async function putProfile(uid: string, profile: Profile): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: 'PROFILE',
        ...profile,
      },
    })
  );
}

export async function getMovingoCards(uid: string): Promise<MovingoCard[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'MOVINGO#' },
    })
  );
  return (result.Items ?? []).map((item) => ({
    cardId: item.SK.replace('MOVINGO#', ''),
    movingoId: item.movingoId,
    cardType: item.cardType,
    price: item.price,
    purchaseDate: item.purchaseDate,
    expiryDate: item.expiryDate,
  }));
}

export async function putMovingoCard(uid: string, card: MovingoCard): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: `MOVINGO#${card.cardId}`,
        movingoId: card.movingoId,
        cardType: card.cardType,
        price: card.price,
        purchaseDate: card.purchaseDate,
        expiryDate: card.expiryDate,
      },
    })
  );
}

export async function deleteMovingoCard(uid: string, cardId: string): Promise<void> {
  await client.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `MOVINGO#${cardId}` },
    })
  );
}

// --- Push Subscriptions ---

import type { PushSubscription } from './types.ts';

export async function getPushSubscriptions(uid: string): Promise<PushSubscription[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'PUSH#' },
    })
  );
  return (result.Items ?? []).map((item) => ({
    endpoint: item.endpoint,
    keys: {
      p256dh: item.p256dh,
      auth: item.auth,
    },
  }));
}

export async function putPushSubscription(uid: string, subscription: PushSubscription): Promise<void> {
  const subscriptionId = Buffer.from(subscription.endpoint).toString('base64url').slice(-40);
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: `PUSH#${subscriptionId}`,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        createdAt: new Date().toISOString(),
      },
    })
  );
}

export async function deletePushSubscription(uid: string, endpoint: string): Promise<void> {
  const subscriptionId = Buffer.from(endpoint).toString('base64url').slice(-40);
  await client.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `PUSH#${subscriptionId}` },
    })
  );
}
