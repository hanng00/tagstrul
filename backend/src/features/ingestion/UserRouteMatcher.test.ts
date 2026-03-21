import { describe, it, expect } from 'bun:test';
import { matchDelaysToUsers, type UserRoute, type UserDelayMatch } from './UserRouteMatcher.ts';
import type { DetectedDelay } from './DelayDetector.ts';
import type { MovingoCard } from './CompensationCalculator.ts';

const makeDelay = (overrides: Partial<DetectedDelay> = {}): DetectedDelay => ({
  trainId: 'SJ123',
  fromStation: 'Stockholm C',
  toStation: 'Uppsala C',
  scheduledDeparture: '08:00',
  actualDeparture: '08:30',
  delayMinutes: 30,
  cancelled: false,
  date: '2025-03-20',
  source: 'sj-traffic-info',
  announcedAt: undefined,
  ...overrides,
});

const makeRoute = (overrides: Partial<UserRoute> = {}): UserRoute => ({
  userId: 'user-1',
  routeId: 'route-1',
  fromStation: 'Stockholm C',
  fromStationUic: '7400001',
  toStation: 'Uppsala C',
  toStationUic: '7400002',
  departureTime: undefined,
  ...overrides,
});

const makeCard = (userId: string, overrides: Partial<MovingoCard> = {}): MovingoCard => ({
  cardId: 'card-1',
  cardType: 'movingo-30',
  price: 2200,
  purchaseDate: '2024-12-01',
  expiryDate: '2025-01-01',
  ...overrides,
});

describe('UserRouteMatcher', () => {
  describe('matchDelaysToUsers', () => {
    it('matches delay to user route by station names', () => {
      const delays = [makeDelay()];
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.userId).toBe('user-1');
      expect(matches[0]!.routeId).toBe('route-1');
      expect(matches[0]!.delay.trainId).toBe('SJ123');
    });

    it('does not match when stations do not match', () => {
      const delays = [makeDelay({ fromStation: 'Göteborg C' })];
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(0);
    });

    it('matches reverse direction (B → A when user configured A → B)', () => {
      const delays = [
        makeDelay({
          fromStation: 'Uppsala C',
          toStation: 'Stockholm C',
        }),
      ];
      const routes = [makeRoute()]; // Stockholm → Uppsala
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(1);
      expect(matches[0]!.userId).toBe('user-1');
    });

    it('respects departure time window when specified', () => {
      const delays = [makeDelay({ scheduledDeparture: '08:00' })];
      const routes = [makeRoute({ departureTime: '08:30' })]; // Within 60 min window
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(1);
    });

    it('excludes delays outside departure time window', () => {
      const delays = [makeDelay({ scheduledDeparture: '08:00' })];
      const routes = [makeRoute({ departureTime: '10:30' })]; // Outside 60 min window
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(0);
    });

    it('ignores time filter for reverse direction matches', () => {
      const delays = [
        makeDelay({
          fromStation: 'Uppsala C',
          toStation: 'Stockholm C',
          scheduledDeparture: '18:00', // Evening return trip
        }),
      ];
      const routes = [makeRoute({ departureTime: '08:00' })]; // Morning departure configured
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      // Should match because reverse direction ignores time filter
      expect(matches).toHaveLength(1);
    });

    it('deduplicates same delay for same user', () => {
      const delays = [makeDelay()];
      // Two routes that would both match the same delay
      const routes = [
        makeRoute({ routeId: 'route-1' }),
        makeRoute({ routeId: 'route-2' }),
      ];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      // Should only match once per user per train per direction per day
      expect(matches).toHaveLength(1);
    });

    it('matches same delay to multiple users', () => {
      const delays = [makeDelay()];
      const routes = [
        makeRoute({ userId: 'user-1', routeId: 'route-1' }),
        makeRoute({ userId: 'user-2', routeId: 'route-2' }),
      ];
      const cards = new Map([
        ['user-1', makeCard('user-1')],
        ['user-2', makeCard('user-2')],
      ]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches).toHaveLength(2);
      expect(matches.map((m) => m.userId).sort()).toEqual(['user-1', 'user-2']);
    });

    it('calculates estimated compensation when card exists', () => {
      const delays = [makeDelay({ delayMinutes: 30 })];
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches[0]!.estimatedCompensation).toBe(50); // 100 SEK trip * 50%
      expect(matches[0]!.claimable).toBe(true);
    });

    it('returns 0 compensation when no card exists', () => {
      const delays = [makeDelay({ delayMinutes: 30 })];
      const routes = [makeRoute()];
      const cards = new Map<string, MovingoCard>(); // No cards

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches[0]!.estimatedCompensation).toBe(0);
      expect(matches[0]!.claimable).toBe(true);
    });

    it('marks non-claimable delays correctly', () => {
      const delays = [makeDelay({ delayMinutes: 15 })]; // Under 20 min
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches[0]!.claimable).toBe(false);
      expect(matches[0]!.estimatedCompensation).toBe(0);
    });

    it('detects likely scheduled changes (72h rule)', () => {
      const delays = [
        makeDelay({
          date: '2025-03-20',
          scheduledDeparture: '08:00',
          announcedAt: '2025-03-15T08:00:00', // 5 days before
        }),
      ];
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches[0]!.likelyScheduledChange).toBe(true);
    });

    it('marks acute delays as not scheduled changes', () => {
      const delays = [
        makeDelay({
          date: '2025-03-20',
          scheduledDeparture: '08:00',
          announcedAt: '2025-03-20T07:30:00', // 30 min before
        }),
      ];
      const routes = [makeRoute()];
      const cards = new Map([['user-1', makeCard('user-1')]]);

      const matches = matchDelaysToUsers(delays, routes, cards);

      expect(matches[0]!.likelyScheduledChange).toBe(false);
    });
  });
});
