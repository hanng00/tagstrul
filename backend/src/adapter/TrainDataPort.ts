export interface TrainDeparture {
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
}

export interface StationPair {
  from: string;
  to: string;
}

export interface TrainDataPort {
  fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]>;
}
