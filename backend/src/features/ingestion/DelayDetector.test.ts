import { describe, it, expect } from 'bun:test';
import { detectDelays, type DetectedDelay } from './DelayDetector.ts';
import type { TrainDeparture } from '../../adapter/TrainDataPort.ts';

const makeDeparture = (overrides: Partial<TrainDeparture> = {}): TrainDeparture => ({
  trainId: 'SJ123',
  fromStation: 'Stockholm C',
  toStation: 'Uppsala C',
  date: '2025-03-20',
  scheduledDeparture: '08:00',
  actualDeparture: '08:00',
  delayMinutes: 0,
  cancelled: false,
  source: 'sj-traffic-info',
  ...overrides,
});

describe('DelayDetector', () => {
  describe('detectDelays', () => {
    it('returns empty array when no delays or cancellations', () => {
      const departures = [
        makeDeparture({ delayMinutes: 0, cancelled: false }),
        makeDeparture({ trainId: 'SJ456', delayMinutes: 0, cancelled: false }),
      ];

      const delays = detectDelays(departures);

      expect(delays).toHaveLength(0);
    });

    it('detects delayed departures', () => {
      const departures = [
        makeDeparture({ trainId: 'SJ123', delayMinutes: 15 }),
        makeDeparture({ trainId: 'SJ456', delayMinutes: 0 }),
      ];

      const delays = detectDelays(departures);

      expect(delays).toHaveLength(1);
      expect(delays[0]!.trainId).toBe('SJ123');
      expect(delays[0]!.delayMinutes).toBe(15);
    });

    it('detects cancelled departures', () => {
      const departures = [
        makeDeparture({ trainId: 'SJ123', cancelled: true, delayMinutes: 0 }),
        makeDeparture({ trainId: 'SJ456', cancelled: false, delayMinutes: 0 }),
      ];

      const delays = detectDelays(departures);

      expect(delays).toHaveLength(1);
      expect(delays[0]!.trainId).toBe('SJ123');
      expect(delays[0]!.cancelled).toBe(true);
    });

    it('detects both delayed and cancelled departures', () => {
      const departures = [
        makeDeparture({ trainId: 'SJ123', delayMinutes: 30 }),
        makeDeparture({ trainId: 'SJ456', cancelled: true }),
        makeDeparture({ trainId: 'SJ789', delayMinutes: 0, cancelled: false }),
      ];

      const delays = detectDelays(departures);

      expect(delays).toHaveLength(2);
      expect(delays.map((d) => d.trainId).sort()).toEqual(['SJ123', 'SJ456']);
    });

    it('preserves all fields from departure', () => {
      const departures = [
        makeDeparture({
          trainId: 'SJ123',
          fromStation: 'Stockholm C',
          toStation: 'Uppsala C',
          date: '2025-03-20',
          scheduledDeparture: '08:00',
          actualDeparture: '08:30',
          delayMinutes: 30,
          cancelled: false,
          source: 'sj-traffic-info',
          rawRef: 'ref-123',
          announcedAt: '2025-03-20T07:00:00',
          disruptionReason: 'Signal failure',
        }),
      ];

      const delays = detectDelays(departures);

      expect(delays[0]!).toEqual({
        trainId: 'SJ123',
        fromStation: 'Stockholm C',
        toStation: 'Uppsala C',
        date: '2025-03-20',
        scheduledDeparture: '08:00',
        actualDeparture: '08:30',
        delayMinutes: 30,
        cancelled: false,
        source: 'sj-traffic-info',
        rawRef: 'ref-123',
        announcedAt: '2025-03-20T07:00:00',
        disruptionReason: 'Signal failure',
      });
    });

    it('includes small delays (threshold applied later)', () => {
      const departures = [
        makeDeparture({ delayMinutes: 1 }), // Even 1 minute delay
        makeDeparture({ delayMinutes: 5 }),
        makeDeparture({ delayMinutes: 10 }),
      ];

      const delays = detectDelays(departures);

      // All delays captured, claimable threshold (20 min) applied later
      expect(delays).toHaveLength(3);
    });
  });
});
