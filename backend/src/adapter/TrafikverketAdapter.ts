import type { TrainDataPort, TrainDeparture, StationPair } from './TrainDataPort.ts';

/**
 * Placeholder for Trafikverket integration.
 * Trafikverket open API: https://api.trafikinfo.trafikverket.se/
 * Requires free API key, returns XML/JSON
 */
export class TrafikverketAdapter implements TrainDataPort {
  async fetchDepartures(_route: StationPair, _date: string): Promise<TrainDeparture[]> {
    throw new Error('TrafikverketAdapter not yet implemented');
  }
}
