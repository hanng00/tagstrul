import type { TrainDeparture } from '../../domain/train.ts';
import type { Operator } from '../../domain/operator.ts';

export interface DetectedDelay {
  trainId: string;
  fromStation: string;
  toStation: string;
  date: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  delayMinutes: number;
  cancelled: boolean;
  source: string;
  operator?: Operator;
  rawRef?: string;
  /** ISO timestamp when the delay/cancellation was announced (from SJ's xodRemarks.editedDate) */
  announcedAt?: string;
  /** Header/reason for the disruption */
  disruptionReason?: string;
}

/**
 * Returns all departures that are delayed OR cancelled.
 * We capture everything — the claimable threshold (≥20 min) is
 * applied later by domain/compensation and UserRouteMatcher.
 * This lets the frontend show all delayed trips, not just claimable ones.
 */
export function detectDelays(departures: TrainDeparture[]): DetectedDelay[] {
  return departures
    .filter((d) => d.delayMinutes > 0 || d.cancelled)
    .map((d) => ({
      trainId: d.trainId,
      fromStation: d.fromStation,
      toStation: d.toStation,
      date: d.date,
      scheduledDeparture: d.scheduledDeparture,
      actualDeparture: d.actualDeparture,
      delayMinutes: d.delayMinutes,
      cancelled: d.cancelled,
      source: d.source,
      operator: d.operator,
      rawRef: d.rawRef,
      announcedAt: d.announcedAt,
      disruptionReason: d.disruptionReason,
    }));
}
