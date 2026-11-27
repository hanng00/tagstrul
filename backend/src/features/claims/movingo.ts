import type { MovingoCard } from '../../types.ts';

/**
 * Picks the Movingo card that was valid on the trip date (YYYY-MM-DD).
 *
 * SJ checks the card against the journey, not against today, so a trip made on a
 * card that has since expired is still claimable, and a card bought after the trip
 * is not. When several cards cover the date, the one valid the longest wins.
 */
export function findCardForDate(cards: MovingoCard[], date: string): MovingoCard | undefined {
  return cards
    .filter((c) => (!c.purchaseDate || c.purchaseDate.slice(0, 10) <= date) && c.expiryDate.slice(0, 10) >= date)
    .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate))[0];
}
