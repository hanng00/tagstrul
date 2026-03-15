import type { DynamoDBStreamEvent } from 'aws-lambda';
import { createTrainDataAdapter } from '../../adapter/TrainDataPort.ts';
import { detectDelays } from './DelayDetector.ts';
import { matchDelaysToUsers } from './UserRouteMatcher.ts';
import { getUserRoutes, getUserMovingoCard, writeTrainSnapshots, writeUserDelays } from '../../ingestion-repository.ts';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const userIds = new Set<string>();

  for (const record of event.Records) {
    if (record.eventName !== 'INSERT') continue;

    const pk = record.dynamodb?.NewImage?.PK?.S;
    const sk = record.dynamodb?.NewImage?.SK?.S;

    if (!pk?.startsWith('USER#') || !sk?.startsWith('ROUTE#')) continue;

    userIds.add(pk.replace('USER#', ''));
  }

  if (userIds.size === 0) {
    console.log('[PollUserRoutes] No new routes in stream batch, skipping');
    return;
  }

  const adapter = createTrainDataAdapter();
  const today = new Date().toISOString().slice(0, 10);

  for (const userId of userIds) {
    console.log(`[PollUserRoutes] Processing user ${userId} on ${today}`);

    const [userRoutes, movingoCard] = await Promise.all([
      getUserRoutes(userId),
      getUserMovingoCard(userId),
    ]);

    if (userRoutes.length === 0) {
      console.log(`[PollUserRoutes] No routes found for user ${userId}, skipping`);
      continue;
    }

    const activeCards = new Map<string, NonNullable<typeof movingoCard>>();
    if (movingoCard) {
      activeCards.set(userId, movingoCard);
    }

    const routePairs = userRoutes.map((r) => ({
      from: r.fromStation,
      fromUic: r.fromStationUic,
      to: r.toStation,
      toUic: r.toStationUic,
    }));
    const uniquePairs = [...new Map(routePairs.map((p) => [`${p.fromUic}|${p.toUic}`, p])).values()];

    console.log(`[PollUserRoutes] Polling ${uniquePairs.length} route pairs for user ${userId}`);

    const allDepartures = (await Promise.all(uniquePairs.map((pair) => adapter.fetchDepartures(pair, today)))).flat();
    console.log(`[PollUserRoutes] Fetched ${allDepartures.length} departures`);

    await writeTrainSnapshots(allDepartures);

    const delays = detectDelays(allDepartures);
    console.log(`[PollUserRoutes] Detected ${delays.length} delayed/cancelled departures`);

    if (delays.length === 0) continue;

    const matches = matchDelaysToUsers(delays, userRoutes, activeCards);
    const claimableCount = matches.filter((m) => m.claimable).length;
    console.log(`[PollUserRoutes] Matched ${matches.length} to user (${claimableCount} claimable)`);

    if (matches.length === 0) continue;

    await writeUserDelays(matches);
    console.log(`[PollUserRoutes] Wrote ${matches.length} user delay records for user ${userId}`);
  }

  console.log(`[PollUserRoutes] Done processing ${userIds.size} users`);
};
