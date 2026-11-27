import type { UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import type { UserDelayMatch } from './UserRouteMatcher.ts';

/** Days a user has to file a claim, counted from when we first saw the delay as claimable. */
export const CLAIM_WINDOW_DAYS = 30;

export function delayIdFor(m: UserDelayMatch): string {
  return `${m.delay.date}_${m.delay.trainId}_${m.fromStationUic}_${m.toStationUic}`;
}

/**
 * Builds an upsert for a user's delay record.
 *
 * Polling runs every hour, and a train's delay usually changes between polls
 * (it grows, or the train is cancelled). The first sighting creates the record and
 * every later sighting refreshes the live fields with the latest data. Fields the user
 * owns (claimed, dismissed, claimId) are never touched, and records that are already
 * claimed are left alone entirely through the condition.
 *
 * Use ReturnValues ALL_OLD to learn whether the record existed and what it looked like.
 */
export function buildDelayUpsert(table: string, m: UserDelayMatch, now: Date): UpdateCommandInput {
  const deadline = new Date(now);
  deadline.setDate(deadline.getDate() + CLAIM_WINDOW_DAYS);

  // Fields refreshed on every sighting. Undefined values are skipped so a missing
  // value in one poll does not wipe what an earlier poll found.
  const live: Record<string, unknown> = {
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
    source: m.delay.source,
    operator: m.delay.operator,
    trainDataRef: m.delay.rawRef,
    announcedAt: m.delay.announcedAt,
    disruptionReason: m.delay.disruptionReason,
    likelyScheduledChange: m.likelyScheduledChange,
    lastSeenAt: now.toISOString(),
  };

  // Fields set only when the record is first created (or first becomes claimable).
  const sticky: Record<string, unknown> = {
    claimed: false,
    detectedAt: now.toISOString(),
    firstSeenAt: now.toISOString(),
    ...(m.claimable ? { claimDeadline: deadline.toISOString().slice(0, 10) } : {}),
  };

  const names: Record<string, string> = { '#claimed': 'claimed' };
  const values: Record<string, unknown> = { ':false': false };
  const sets: string[] = [];

  for (const [key, value] of Object.entries(live)) {
    if (value === undefined) continue;
    names[`#${key}`] = key;
    values[`:${key}`] = value;
    sets.push(`#${key} = :${key}`);
  }
  for (const [key, value] of Object.entries(sticky)) {
    names[`#${key}`] = key;
    values[`:${key}`] = value;
    sets.push(`#${key} = if_not_exists(#${key}, :${key})`);
  }

  return {
    TableName: table,
    Key: { PK: `USER#${m.userId}`, SK: `DELAY#${delayIdFor(m)}` },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ConditionExpression: 'attribute_not_exists(PK) OR attribute_not_exists(#claimed) OR #claimed = :false',
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: 'ALL_OLD',
  };
}

/**
 * True when this sighting is the first time the user's delay is claimable,
 * which is when we should notify them. `previous` is the record before the write
 * (undefined for a brand new record).
 */
export function becameClaimable(m: UserDelayMatch, previous: Record<string, unknown> | undefined): boolean {
  if (!m.claimable) return false;
  return !previous || previous.claimable !== true;
}
