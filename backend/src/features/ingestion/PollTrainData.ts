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
  getUserPushSubscriptions,
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
  console.log(`[PollTrainData] Wrote ${matches.length} user delay records.`);

  // Send push notifications for claimable delays (if configured)
  const claimableMatches = matches.filter((m) => m.claimable && !m.likelyScheduledChange);
  if (claimableMatches.length > 0 && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    console.log(`[PollTrainData] Sending push notifications for ${claimableMatches.length} claimable delays`);
    
    // Dynamic import to avoid build errors when web-push isn't installed
    const { sendPushNotification, formatDelayNotification } = await import('../push/PushSender.ts');
    
    const userIds = [...new Set(claimableMatches.map((m) => m.userId))];
    const subscriptionsByUser = new Map<string, Awaited<ReturnType<typeof getUserPushSubscriptions>>>();
    
    await Promise.all(
      userIds.map(async (userId) => {
        const subs = await getUserPushSubscriptions(userId);
        if (subs.length > 0) {
          subscriptionsByUser.set(userId, subs);
        }
      }),
    );

    let sentCount = 0;
    for (const match of claimableMatches) {
      const subscriptions = subscriptionsByUser.get(match.userId);
      if (!subscriptions || subscriptions.length === 0) continue;

      const delayId = `${match.delay.date}_${match.delay.trainId}_${match.fromStationUic}_${match.toStationUic}`;
      const notification = formatDelayNotification({
        delayId,
        fromStation: match.delay.fromStation,
        toStation: match.delay.toStation,
        delayMinutes: match.delay.delayMinutes,
        cancelled: match.delay.cancelled,
        estimatedCompensation: match.estimatedCompensation,
      });

      for (const sub of subscriptions) {
        const sent = await sendPushNotification(sub, notification);
        if (sent) sentCount++;
      }
    }

    console.log(`[PollTrainData] Sent ${sentCount} push notifications`);
  }

  console.log(`[PollTrainData] Done.`);
};
