import type { TrainDeparture, StationPair } from '../domain/train.ts';

export type { TrainDeparture, StationPair };

/** Driven port: fetches the day's departures for a station pair from some train data source. */
export interface TrainDataPort {
  fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]>;
}
