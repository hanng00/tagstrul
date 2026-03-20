import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { success, unauthorized, internalServerError } from '../../utils/response.ts';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'tagstrul-admin-2024';

interface AdminStats {
  users: {
    total: number;
    withRoutes: number;
    withMovingoCards: number;
    withOnboardingComplete: number;
  };
  routes: {
    total: number;
    withDepartureTime: number;
    topStations: { station: string; count: number }[];
  };
  delays: {
    total: number;
    claimable: number;
    claimed: number;
    dismissed: number;
    cancelled: number;
    byDelayTier: {
      tier20to39: number;
      tier40to59: number;
      tier60plus: number;
    };
  };
  claims: {
    total: number;
    submitted: number;
    approved: number;
    rejected: number;
    totalEstimatedCompensation: number;
    totalActualCompensation: number;
  };
  feedback: {
    total: number;
    recent: { message: string; email?: string; createdAt: string }[];
  };
  recentUsers: {
    email: string;
    createdAt: string;
    hasRoutes: boolean;
    hasMovingo: boolean;
    onboardingComplete: boolean;
  }[];
  generatedAt: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const secret = event.queryStringParameters?.secret;
    if (secret !== ADMIN_SECRET) {
      return unauthorized('Invalid admin secret');
    }

    const stats = await collectStats();
    return success(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return internalServerError(error);
  }
};

async function collectStats(): Promise<AdminStats> {
  const allItems = await scanAllItems();

  const userIds = new Set<string>();
  const usersWithRoutes = new Set<string>();
  const usersWithMovingo = new Set<string>();
  const usersWithOnboarding = new Set<string>();
  const stationCounts = new Map<string, number>();
  const userProfiles = new Map<string, { email?: string; createdAt?: string; onboardingComplete?: boolean }>();

  let totalRoutes = 0;
  let routesWithDepartureTime = 0;

  let totalDelays = 0;
  let claimableDelays = 0;
  let claimedDelays = 0;
  let dismissedDelays = 0;
  let cancelledDelays = 0;
  let tier20to39 = 0;
  let tier40to59 = 0;
  let tier60plus = 0;

  let totalClaims = 0;
  let submittedClaims = 0;
  let approvedClaims = 0;
  let rejectedClaims = 0;
  let totalEstimatedCompensation = 0;
  let totalActualCompensation = 0;

  const feedbackItems: { message: string; email?: string; createdAt: string }[] = [];

  for (const item of allItems) {
    const pk = item.PK as string;
    const sk = item.SK as string;

    if (pk.startsWith('USER#')) {
      const userId = pk.replace('USER#', '');
      userIds.add(userId);

      if (sk.startsWith('ROUTE#')) {
        totalRoutes++;
        usersWithRoutes.add(userId);
        if (item.departureTime) routesWithDepartureTime++;

        const from = item.fromStation as string;
        const to = item.toStation as string;
        if (from) stationCounts.set(from, (stationCounts.get(from) || 0) + 1);
        if (to) stationCounts.set(to, (stationCounts.get(to) || 0) + 1);
      }

      if (sk.startsWith('MOVINGO#')) {
        usersWithMovingo.add(userId);
      }

      if (sk === 'PROFILE') {
        if (item.onboardingComplete) {
          usersWithOnboarding.add(userId);
        }
        userProfiles.set(userId, {
          email: item.email as string | undefined,
          createdAt: item.createdAt as string | undefined,
          onboardingComplete: item.onboardingComplete as boolean | undefined,
        });
      }

      if (sk.startsWith('DELAY#')) {
        totalDelays++;
        const delayMinutes = (item.delayMinutes as number) || 0;
        const cancelled = item.cancelled as boolean;
        const claimed = item.claimed as boolean;
        const dismissed = item.dismissed as boolean;

        if (cancelled) cancelledDelays++;
        if (claimed) claimedDelays++;
        if (dismissed) dismissedDelays++;

        const isClaimable = delayMinutes >= 20 || cancelled;
        if (isClaimable) claimableDelays++;

        if (delayMinutes >= 20 && delayMinutes < 40) tier20to39++;
        else if (delayMinutes >= 40 && delayMinutes < 60) tier40to59++;
        else if (delayMinutes >= 60) tier60plus++;
      }

      if (sk.startsWith('CLAIM#')) {
        totalClaims++;
        const status = item.status as string;
        if (status === 'submitted') submittedClaims++;
        else if (status === 'approved') approvedClaims++;
        else if (status === 'rejected') rejectedClaims++;

        totalEstimatedCompensation += (item.estimatedCompensation as number) || 0;
        totalActualCompensation += (item.actualCompensation as number) || 0;
      }
    }

    if (pk === 'FEEDBACK' && sk.startsWith('FEEDBACK#')) {
      feedbackItems.push({
        message: item.message as string,
        email: item.email as string | undefined,
        createdAt: item.createdAt as string,
      });
    }
  }

  const topStations = Array.from(stationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([station, count]) => ({ station, count }));

  const recentFeedback = feedbackItems
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const recentUsers = Array.from(userProfiles.entries())
    .filter(([, profile]) => profile.email)
    .map(([userId, profile]) => ({
      email: profile.email!,
      createdAt: profile.createdAt || '',
      hasRoutes: usersWithRoutes.has(userId),
      hasMovingo: usersWithMovingo.has(userId),
      onboardingComplete: profile.onboardingComplete || false,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  return {
    users: {
      total: userIds.size,
      withRoutes: usersWithRoutes.size,
      withMovingoCards: usersWithMovingo.size,
      withOnboardingComplete: usersWithOnboarding.size,
    },
    routes: {
      total: totalRoutes,
      withDepartureTime: routesWithDepartureTime,
      topStations,
    },
    delays: {
      total: totalDelays,
      claimable: claimableDelays,
      claimed: claimedDelays,
      dismissed: dismissedDelays,
      cancelled: cancelledDelays,
      byDelayTier: {
        tier20to39,
        tier40to59,
        tier60plus,
      },
    },
    claims: {
      total: totalClaims,
      submitted: submittedClaims,
      approved: approvedClaims,
      rejected: rejectedClaims,
      totalEstimatedCompensation,
      totalActualCompensation,
    },
    feedback: {
      total: feedbackItems.length,
      recent: recentFeedback,
    },
    recentUsers,
    generatedAt: new Date().toISOString(),
  };
}

async function scanAllItems(): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const result = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastKey,
      })
    );
    items.push(...(result.Items ?? []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}
