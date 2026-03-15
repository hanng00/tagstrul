import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { Route, Delay, Claim, Profile, MovingoCard } from './types.ts';

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
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${uid}`, ':sk': 'DELAY#' },
    })
  );
  return (result.Items ?? []).map((item) => ({
    delayId: item.SK.replace('DELAY#', ''),
    routeId: item.routeId,
    fromStation: item.fromStation,
    toStation: item.toStation,
    date: item.date,
    scheduledDeparture: item.scheduledDeparture,
    delayMinutes: item.delayMinutes,
    cancelled: item.cancelled ?? false,
    estimatedCompensation: item.estimatedCompensation,
    claimable: item.claimable ?? false,
    claimed: item.claimed ?? false,
    claimDeadline: item.claimDeadline,
  }));
}

export async function getDelay(uid: string, delayId: string): Promise<(Delay & { trainId?: string; fromStationUic?: string; toStationUic?: string }) | null> {
  const result = await client.send(
    new GetCommand({
      TableName: TABLE,
      Key: { PK: `USER#${uid}`, SK: `DELAY#${delayId}` },
    })
  );
  if (!result.Item) return null;
  return {
    delayId: result.Item.SK.replace('DELAY#', ''),
    routeId: result.Item.routeId,
    fromStation: result.Item.fromStation,
    toStation: result.Item.toStation,
    fromStationUic: result.Item.fromStationUic,
    toStationUic: result.Item.toStationUic,
    date: result.Item.date,
    scheduledDeparture: result.Item.scheduledDeparture,
    delayMinutes: result.Item.delayMinutes,
    cancelled: result.Item.cancelled ?? false,
    estimatedCompensation: result.Item.estimatedCompensation,
    claimable: result.Item.claimable ?? false,
    claimed: result.Item.claimed ?? false,
    claimDeadline: result.Item.claimDeadline,
    trainId: result.Item.trainId,
  };
}

export async function markDelayClaimed(uid: string, delayId: string): Promise<void> {
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: `DELAY#${delayId}`,
      },
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
  }));
}

export async function putClaim(uid: string, claim: Claim): Promise<void> {
  await client.send(
    new PutCommand({
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
    })
  );

  // Mark the delay as claimed
  await client.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        PK: `USER#${uid}`,
        SK: `DELAY#${claim.delayId}`,
        claimed: true,
      },
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
