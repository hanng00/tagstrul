import type { Handler } from 'aws-lambda';
import { SJTrafficInfoAdapter } from '../../adapter/SJTrafficInfoAdapter.ts';
import { detectDelays } from './DelayDetector.ts';
import { matchDelaysToUsers } from './UserRouteMatcher.ts';
import { getUserRoutes, getUserMovingoCard, writeTrainSnapshots, writeUserDelays } from '../../ingestion-repository.ts';

interface PollUserRoutesEvent {
  userId: string;
}

export const handler: Handler<PollUserRoutesEvent, void> = async (event) => {
  const { userId } = event;
  if (!userId) {
    console.log('[PollUserRoutes] No userId provided, skipping');
    return;
  }

  const adapter = new SJTrafficInfoAdapter();
  const today = new Date().toISOString().slice(0, 10);

  console.log(`[PollUserRoutes] Starting poll for user ${userId} on ${today}`);

  const [userRoutes, movingoCard] = await Promise.all([
    getUserRoutes(userId),
    getUserMovingoCard(userId),
  ]);

  if (userRoutes.length === 0) {
    console.log('[PollUserRoutes] No routes found for user, skipping');
    return;
  }

  const activeCards = new Map<string, NonNullable<typeof movingoCard>>();
  if (movingoCard) {
    activeCards.set(userId, movingoCard);
  }

  const routePairs = userRoutes.map((r) => ({ from: r.fromStation, to: r.toStation }));
  const uniquePairs = [...new Map(routePairs.map((p) => [`${p.from}|${p.to}`, p])).values()];

  console.log(`[PollUserRoutes] Polling ${uniquePairs.length} route pairs for user`);

  const allDepartures = (await Promise.all(uniquePairs.map((pair) => adapter.fetchDepartures(pair, today)))).flat();
  console.log(`[PollUserRoutes] Fetched ${allDepartures.length} departures`);

  await writeTrainSnapshots(allDepartures);

  const delays = detectDelays(allDepartures);
  console.log(`[PollUserRoutes] Detected ${delays.length} delayed/cancelled departures`);

  if (delays.length === 0) return;

  const matches = matchDelaysToUsers(delays, userRoutes, activeCards);
  const claimableCount = matches.filter((m) => m.claimable).length;
  console.log(`[PollUserRoutes] Matched ${matches.length} to user (${claimableCount} claimable)`);

  if (matches.length === 0) return;

  await writeUserDelays(matches);
  console.log(`[PollUserRoutes] Done. Wrote ${matches.length} user delay records.`);
};
