import { describe, expect, test } from 'bun:test';
import { normalizeOperator } from './operator.ts';
import { claimProviderFor } from './claims.ts';

describe('normalizeOperator', () => {
  test.each([
    ['SJ', 'sj'],
    ['sj', 'sj'],
    ['SJ AB', 'sj'],
    ['Mälartåg', 'malartag'],
    ['MALARTAG', 'malartag'],
    ['Mälardalstrafik', 'malartag'],
    ['SL', 'unknown'],
    ['', 'unknown'],
    [undefined, 'unknown'],
  ] as const)('%p → %p', (raw, expected) => {
    expect(normalizeOperator(raw)).toBe(expected);
  });
});

describe('claimProviderFor', () => {
  test('sends every claim to SJ until other providers are supported', () => {
    expect(claimProviderFor('sj')).toBe('sj');
    expect(claimProviderFor('malartag')).toBe('sj');
    expect(claimProviderFor('unknown')).toBe('sj');
    expect(claimProviderFor(undefined)).toBe('sj');
  });
});
