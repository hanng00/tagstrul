import type { ScheduledEvent } from 'aws-lambda';
import { createTrainDataAdapter } from '../../adapter/TrainDataPort.ts';
import { detectDelays } from './DelayDetector.ts';
import { matchDelaysToUsers } from './UserRouteMatcher.ts';
import {
  getAllUserRoutes,
  getActiveMovingoCards,
  uniqueRoutePairs,
  writeTrainSnapshots,
  writeUserDelays,
} from '../../ingestion-repository.ts';

export const handler = async (_event: ScheduledEvent): Promise<void> => {
  const adapter = createTrainDataAdapter();
  const today = new Date().toISOString().slice(0, 10);

  console.log(`[PollTrainData] Starting poll for ${today}`);

  const [userRoutes, activeCards] = await Promise.all([getAllUserRoutes(), getActiveMovingoCards()]);

  if (userRoutes.length === 0) {
    console.log('[PollTrainData] No user routes found, skipping');
    return;
  }

  const routePairs = uniqueRoutePairs(userRoutes);
  console.log(
    `[PollTrainData] Polling ${routePairs.length} route pairs for ${userRoutes.length} routes, ${activeCards.size} active cards`,
  );

  const allDepartures = (await Promise.all(routePairs.map((pair) => adapter.fetchDepartures(pair, today)))).flat();
  console.log(`[PollTrainData] Fetched ${allDepartures.length} departures`);

  await writeTrainSnapshots(allDepartures);

  const delays = detectDelays(allDepartures);
  console.log(`[PollTrainData] Detected ${delays.length} delayed/cancelled departures`);

  if (delays.length === 0) return;

  const matches = matchDelaysToUsers(delays, userRoutes, activeCards);
  const claimableCount = matches.filter((m) => m.claimable).length;
  console.log(`[PollTrainData] Matched ${matches.length} to users (${claimableCount} claimable)`);

  if (matches.length === 0) return;

  await writeUserDelays(matches);
  console.log(`[PollTrainData] Done. Wrote ${matches.length} user delay records.`);
};
