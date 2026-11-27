import { describe, expect, test } from 'bun:test';
import { findCardForDate } from './movingo.ts';
import type { MovingoCard } from '../types.ts';

const card = (cardId: string, purchaseDate: string, expiryDate: string): MovingoCard => ({
  cardId,
  movingoId: `m-${cardId}`,
  cardType: 'movingo-30',
  price: 2000,
  purchaseDate,
  expiryDate,
});

describe('findCardForDate', () => {
  const october = card('oct', '2026-10-01', '2026-10-30');
  const november = card('nov', '2026-10-31', '2026-11-29');

  test('picks the card valid on the trip date, even if it has expired since', () => {
    expect(findCardForDate([november, october], '2026-10-15')?.cardId).toBe('oct');
  });

  test('ignores cards bought after the trip', () => {
    expect(findCardForDate([november], '2026-10-15')).toBeUndefined();
  });

  test('includes the first and last day of the card', () => {
    expect(findCardForDate([november], '2026-10-31')?.cardId).toBe('nov');
    expect(findCardForDate([november], '2026-11-29')?.cardId).toBe('nov');
  });

  test('prefers the card that lasts longest when several overlap', () => {
    const renewed = card('renewed', '2026-11-20', '2026-12-19');
    expect(findCardForDate([november, renewed], '2026-11-25')?.cardId).toBe('renewed');
  });

  test('handles cards without a purchase date', () => {
    expect(findCardForDate([card('x', '', '2026-12-01')], '2026-11-01')?.cardId).toBe('x');
  });

  test('returns undefined with no cards', () => {
    expect(findCardForDate([], '2026-11-01')).toBeUndefined();
  });
});
