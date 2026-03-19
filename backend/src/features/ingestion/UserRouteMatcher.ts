import type { DetectedDelay } from './DelayDetector.ts';
import {
  estimateCompensation,
  isClaimable,
  isLikelyScheduledChange,
  buildDepartureDateTime,
  type MovingoCard,
} from './CompensationCalculator.ts';

export interface UserRoute {
  userId: string;
  routeId: string;
  fromStation: string;
  fromStationUic: string;
  toStation: string;
  toStationUic: string;
  departureTime?: string;
}

export interface UserDelayMatch {
  userId: string;
  routeId: string;
  delay: DetectedDelay;
  fromStationUic: string;
  toStationUic: string;
  estimatedCompensation: number;
  claimable: boolean;
  /** True if announced >72h before departure — likely a scheduled change, not eligible for delay compensation */
  likelyScheduledChange: boolean;
}

const DEPARTURE_WINDOW_MINUTES = 60;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

function isWithinWindow(scheduled: string, userTime: string): boolean {
  const diff = Math.abs(timeToMinutes(scheduled) - timeToMinutes(userTime));
  return diff <= DEPARTURE_WINDOW_MINUTES;
}

/**
 * Expand user routes to include both directions.
 * If user configured A → B, we also want to match B → A delays.
 */
function expandRoutesToBothDirections(routes: UserRoute[]): UserRoute[] {
  const expanded: UserRoute[] = [];
  for (const r of routes) {
    // Original direction
    expanded.push(r);
    // Reverse direction (same routeId so it links back to the user's configured route)
    expanded.push({
      userId: r.userId,
      routeId: r.routeId,
      fromStation: r.toStation,
      fromStationUic: r.toStationUic,
      toStation: r.fromStation,
      toStationUic: r.fromStationUic,
      departureTime: undefined, // Don't apply time filter to reverse direction
    });
  }
  return expanded;
}

export function matchDelaysToUsers(
  delays: DetectedDelay[],
  userRoutes: UserRoute[],
  activeCards: Map<string, MovingoCard>,
): UserDelayMatch[] {
  const matches: UserDelayMatch[] = [];
  const seen = new Set<string>();

  // Expand routes to match both directions
  const expandedRoutes = expandRoutesToBothDirections(userRoutes);

  for (const delay of delays) {
    for (const route of expandedRoutes) {
      const stationMatch = delay.fromStation === route.fromStation && delay.toStation === route.toStation;
      if (!stationMatch) continue;

      const timeMatch = !route.departureTime || isWithinWindow(delay.scheduledDeparture, route.departureTime);
      if (!timeMatch) continue;

      // Deduplicate: one delay per user per train per direction per day
      const dedupeKey = `${route.userId}_${delay.date}_${delay.trainId}_${route.fromStationUic}_${route.toStationUic}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      const card = activeCards.get(route.userId);
      const claimable = isClaimable(delay.delayMinutes, delay.cancelled);
      const compensation = card && claimable ? estimateCompensation(delay.delayMinutes, delay.cancelled, card) : 0;

      const departureDateTime = buildDepartureDateTime(delay.date, delay.scheduledDeparture);
      const likelyScheduledChange = isLikelyScheduledChange(delay.announcedAt, departureDateTime);

      matches.push({
        userId: route.userId,
        routeId: route.routeId,
        delay,
        fromStationUic: route.fromStationUic,
        toStationUic: route.toStationUic,
        estimatedCompensation: compensation,
        claimable,
        likelyScheduledChange,
      });
    }
  }

  return matches;
}
