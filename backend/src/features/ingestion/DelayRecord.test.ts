import { describe, expect, test } from 'bun:test';
import { buildDelayUpsert, becameClaimable, delayIdFor } from './DelayRecord.ts';
import type { UserDelayMatch } from './UserRouteMatcher.ts';

function match(overrides: Partial<UserDelayMatch> = {}, delay: Partial<UserDelayMatch['delay']> = {}): UserDelayMatch {
  return {
    userId: 'u1',
    routeId: 'r1',
    fromStationUic: '7400001',
    toStationUic: '7400002',
    estimatedCompensation: 0,
    claimable: false,
    likelyScheduledChange: false,
    ...overrides,
    delay: {
      trainId: '123',
      fromStation: 'Uppsala C',
      toStation: 'Stockholm C',
      date: '2026-11-27',
      scheduledDeparture: '07:30',
      delayMinutes: 12,
      cancelled: false,
      source: 'sj',
      ...delay,
    },
  };
}

const NOW = new Date('2026-11-27T07:00:00.000Z');

describe('delayIdFor', () => {
  test('combines date, train and stations', () => {
    expect(delayIdFor(match())).toBe('2026-11-27_123_7400001_7400002');
  });
});

describe('buildDelayUpsert', () => {
  test('targets the user delay record and skips claimed records', () => {
    const input = buildDelayUpsert('T', match(), NOW);
    expect(input.TableName).toBe('T');
    expect(input.Key).toEqual({ PK: 'USER#u1', SK: 'DELAY#2026-11-27_123_7400001_7400002' });
    expect(input.ConditionExpression).toBe('attribute_not_exists(PK) OR attribute_not_exists(#claimed) OR #claimed = :false');
    expect(input.ReturnValues).toBe('ALL_OLD');
  });

  test('refreshes live fields with the latest values', () => {
    const input = buildDelayUpsert('T', match({ claimable: true, estimatedCompensation: 50 }, { delayMinutes: 45 }), NOW);
    expect(input.UpdateExpression).toContain('#delayMinutes = :delayMinutes');
    expect(input.UpdateExpression).toContain('#claimable = :claimable');
    expect(input.ExpressionAttributeValues?.[':delayMinutes']).toBe(45);
    expect(input.ExpressionAttributeValues?.[':estimatedCompensation']).toBe(50);
    expect(input.ExpressionAttributeValues?.[':lastSeenAt']).toBe(NOW.toISOString());
  });

  test('keeps first sighting fields and never touches user owned fields', () => {
    const input = buildDelayUpsert('T', match(), NOW);
    expect(input.UpdateExpression).toContain('#claimed = if_not_exists(#claimed, :claimed)');
    expect(input.UpdateExpression).toContain('#firstSeenAt = if_not_exists(#firstSeenAt, :firstSeenAt)');
    expect(input.UpdateExpression).not.toContain('dismissed');
    expect(input.UpdateExpression).not.toContain('claimId');
  });

  test('sets a claim deadline only once the delay is claimable', () => {
    expect(buildDelayUpsert('T', match(), NOW).UpdateExpression).not.toContain('claimDeadline');
    const claimable = buildDelayUpsert('T', match({ claimable: true }), NOW);
    expect(claimable.UpdateExpression).toContain('#claimDeadline = if_not_exists(#claimDeadline, :claimDeadline)');
    expect(claimable.ExpressionAttributeValues?.[':claimDeadline']).toBe('2026-12-27');
  });

  test('skips undefined values so earlier data is kept', () => {
    const input = buildDelayUpsert('T', match({}, { actualDeparture: undefined, disruptionReason: undefined }), NOW);
    expect(input.UpdateExpression).not.toContain('actualDeparture');
    expect(input.UpdateExpression).not.toContain('disruptionReason');
    expect(Object.values(input.ExpressionAttributeValues ?? {})).not.toContain(undefined);
  });

  test('every placeholder in the expression is defined', () => {
    const input = buildDelayUpsert('T', match({ claimable: true }, { actualDeparture: '07:45' }), NOW);
    const expr = `${input.UpdateExpression} ${input.ConditionExpression}`;
    for (const name of expr.match(/#\w+/g) ?? []) expect(input.ExpressionAttributeNames).toHaveProperty(name);
    for (const value of expr.match(/:\w+/g) ?? []) expect(input.ExpressionAttributeValues).toHaveProperty(value);
  });
});

describe('becameClaimable', () => {
  test('new claimable record', () => {
    expect(becameClaimable(match({ claimable: true }), undefined)).toBe(true);
  });

  test('existing record that crosses the line', () => {
    expect(becameClaimable(match({ claimable: true }), { claimable: false })).toBe(true);
  });

  test('already claimable record does not notify again', () => {
    expect(becameClaimable(match({ claimable: true }), { claimable: true })).toBe(false);
  });

  test('not claimable never notifies', () => {
    expect(becameClaimable(match({ claimable: false }), undefined)).toBe(false);
  });
});
