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
  /** ISO timestamp when the delay/cancellation was announced (from xodRemarks.editedDate) */
  announcedAt?: string;
  /** Header/reason for the disruption (from xodRemarks.header) */
  disruptionReason?: string;
}

export interface StationPair {
  from: string;
  fromUic: string;
  to: string;
  toUic: string;
}

export interface TrainDataPort {
  fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]>;
}

export function createTrainDataAdapter(): TrainDataPort {
  const provider = process.env.TRAIN_DATA_PROVIDER ?? 'sj';

  switch (provider) {
    case 'trafikverket':
      // Lazy import to avoid loading unused adapters
      const { TrafikverketAdapter } = require('./TrafikverketAdapter.ts');
      return new TrafikverketAdapter();
    case 'sj':
    default:
      const { SJTrafficInfoAdapter } = require('./SJTrafficInfoAdapter.ts');
      return new SJTrafficInfoAdapter();
  }
}
