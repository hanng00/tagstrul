import type { TrainDeparture } from '../../adapter/TrainDataPort.ts';

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
  rawRef?: string;
  /** ISO timestamp when the delay/cancellation was announced (from SJ's xodRemarks.editedDate) */
  announcedAt?: string;
  /** Header/reason for the disruption */
  disruptionReason?: string;
}

/**
 * Returns all departures that are delayed OR cancelled.
 * We capture everything — the claimable threshold (≥20 min) is
 * applied later by CompensationCalculator/UserRouteMatcher.
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
      rawRef: d.rawRef,
      announcedAt: d.announcedAt,
      disruptionReason: d.disruptionReason,
    }));
}
