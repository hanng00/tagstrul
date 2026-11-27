import type { Operator } from './operator.ts';

/**
 * One train's run between two stations on one day, as observed by a data source.
 * Every adapter maps its own API into this shape, and nothing downstream sees the raw API.
 */
export interface TrainDeparture {
  trainId: string;
  fromStation: string;
  toStation: string;
  date: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  delayMinutes: number;
  cancelled: boolean;
  /** Which data source produced this record, e.g. "sj" or "trafikverket". */
  source: string;
  /** Who ran the train. Missing on records written before operators were tracked. */
  operator?: Operator;
  rawRef?: string;
  /** ISO timestamp when the delay/cancellation was announced */
  announcedAt?: string;
  /** Header/reason for the disruption */
  disruptionReason?: string;
}

export interface StationPair {
  from: string;
  fromUic: string;
  to: string;
  toUic: string;
}
