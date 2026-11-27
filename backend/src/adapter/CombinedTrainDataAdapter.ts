import type { TrainDataPort, TrainDeparture, StationPair } from '../ports/TrainDataPort.ts';
import type { Operator } from '../domain/operator.ts';

export interface TrainDataSource {
  port: TrainDataPort;
  /** Keep only trains run by these operators. Omit to keep everything. */
  operators?: Operator[];
}

/**
 * Reads several train data sources and merges them. When two sources report the same
 * train on the same day, the earlier source in the list wins. A failing source is logged
 * and skipped so the others still count.
 */
export class CombinedTrainDataAdapter implements TrainDataPort {
  constructor(private readonly sources: TrainDataSource[]) {}

  async fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]> {
    const results = await Promise.all(
      this.sources.map(async ({ port, operators }) => {
        try {
          const runs = await port.fetchDepartures(route, date);
          return operators ? runs.filter((r) => r.operator && operators.includes(r.operator)) : runs;
        } catch (err) {
          console.error(`[CombinedTrainDataAdapter] A source failed for ${route.from} -> ${route.to}:`, err);
          return [];
        }
      }),
    );

    const seen = new Set<string>();
    const merged: TrainDeparture[] = [];
    for (const run of results.flat()) {
      const key = `${run.date}_${run.trainId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(run);
    }
    return merged;
  }
}
