import { describe, expect, test } from 'bun:test';
import { CombinedTrainDataAdapter } from './CombinedTrainDataAdapter.ts';
import type { TrainDataPort, TrainDeparture } from '../ports/TrainDataPort.ts';

const run = (trainId: string, source: string, operator?: TrainDeparture['operator']): TrainDeparture => ({
  trainId, fromStation: 'Uppsala C', toStation: 'Stockholm C', date: '2026-11-25',
  scheduledDeparture: '07:08', delayMinutes: 0, cancelled: false, source, operator,
});
const port = (runs: TrainDeparture[] | Error): TrainDataPort => ({
  fetchDepartures: async () => {
    if (runs instanceof Error) throw runs;
    return runs;
  },
});
const route = { from: 'Uppsala C', fromUic: '740000005', to: 'Stockholm C', toUic: '740000001' };

describe('CombinedTrainDataAdapter', () => {
  test('lets the first source win for the same train, and filters by operator', async () => {
    const combined = new CombinedTrainDataAdapter([
      { port: port([run('10912', 'trafikverket', 'malartag'), run('2210', 'trafikverket', 'unknown')]), operators: ['malartag'] },
      { port: port([run('10912', 'sj', 'unknown'), run('580', 'sj', 'sj')]) },
    ]);
    const runs = await combined.fetchDepartures(route, '2026-11-25');
    expect(runs.map((r) => `${r.trainId}:${r.source}`)).toEqual(['10912:trafikverket', '580:sj']);
  });

  test('keeps the other sources when one fails', async () => {
    const combined = new CombinedTrainDataAdapter([{ port: port(new Error('down')) }, { port: port([run('580', 'sj', 'sj')]) }]);
    expect((await combined.fetchDepartures(route, '2026-11-25')).map((r) => r.trainId)).toEqual(['580']);
  });
});
