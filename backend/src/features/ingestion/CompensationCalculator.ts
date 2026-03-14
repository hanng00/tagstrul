export type MovingoCardType = 'movingo-30' | 'movingo-90' | 'movingo-year' | 'movingo-5-30';

export interface MovingoCard {
  cardId: string;
  cardType: MovingoCardType;
  price: number;
  purchaseDate: string;
  expiryDate: string;
}

/**
 * Travel days divisor per card type.
 * Cards purchased on/after 2025-01-08 use new divisors.
 */
const TRAVEL_DAYS: Record<MovingoCardType, { pre: number; post: number }> = {
  'movingo-year': { pre: 264, post: 365 },
  'movingo-90': { pre: 66, post: 90 },
  'movingo-30': { pre: 22, post: 30 },
  'movingo-5-30': { pre: 10, post: 10 },
};

const DIVISOR_CUTOFF = '2025-01-08';

function getTravelDays(cardType: MovingoCardType, purchaseDate: string): number {
  const entry = TRAVEL_DAYS[cardType];
  return purchaseDate >= DIVISOR_CUTOFF ? entry.post : entry.pre;
}

export function averageTripPrice(card: MovingoCard): number {
  const days = getTravelDays(card.cardType, card.purchaseDate);
  return card.price / days;
}

/**
 * Mälardalen Movingo compensation tiers:
 *   20–39 min  → 50% of average trip price
 *   40–59 min  → 75%
 *   60+ min    → 100%
 *   cancelled  → 100%
 *   < 20 min   → 0 (not claimable)
 */
export function compensationTier(delayMinutes: number, cancelled: boolean): number {
  if (cancelled) return 1.0;
  if (delayMinutes >= 60) return 1.0;
  if (delayMinutes >= 40) return 0.75;
  if (delayMinutes >= 20) return 0.5;
  return 0;
}

export function estimateCompensation(
  delayMinutes: number,
  cancelled: boolean,
  card: MovingoCard,
): number {
  const tier = compensationTier(delayMinutes, cancelled);
  if (tier === 0) return 0;
  const tripPrice = averageTripPrice(card);
  return Math.round(tripPrice * tier);
}

export function isClaimable(delayMinutes: number, cancelled: boolean): boolean {
  return cancelled || delayMinutes >= 20;
}

export function compensationLabel(delayMinutes: number, cancelled: boolean): string {
  if (cancelled) return 'Inställt — 100%';
  if (delayMinutes >= 60) return `${delayMinutes} min — 100%`;
  if (delayMinutes >= 40) return `${delayMinutes} min — 75%`;
  if (delayMinutes >= 20) return `${delayMinutes} min — 50%`;
  return `${delayMinutes} min`;
}
