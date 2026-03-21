import { describe, it, expect } from 'bun:test';
import {
  averageTripPrice,
  compensationTier,
  estimateCompensation,
  isClaimable,
  isLikelyScheduledChange,
  buildDepartureDateTime,
  compensationLabel,
  type MovingoCard,
} from './CompensationCalculator.ts';

describe('CompensationCalculator', () => {
  describe('averageTripPrice', () => {
    it('uses pre-2025-01-08 divisor for old cards', () => {
      const card: MovingoCard = {
        cardId: '1',
        cardType: 'movingo-30',
        price: 2200,
        purchaseDate: '2024-12-01',
        expiryDate: '2025-01-01',
      };
      // Pre-cutoff: 22 travel days
      expect(averageTripPrice(card)).toBe(100); // 2200 / 22
    });

    it('uses post-2025-01-08 divisor for new cards', () => {
      const card: MovingoCard = {
        cardId: '1',
        cardType: 'movingo-30',
        price: 3000,
        purchaseDate: '2025-01-08',
        expiryDate: '2025-02-08',
      };
      // Post-cutoff: 30 travel days
      expect(averageTripPrice(card)).toBe(100); // 3000 / 30
    });

    it('handles yearly card divisors correctly', () => {
      const preCard: MovingoCard = {
        cardId: '1',
        cardType: 'movingo-year',
        price: 26400,
        purchaseDate: '2024-06-01',
        expiryDate: '2025-06-01',
      };
      expect(averageTripPrice(preCard)).toBe(100); // 26400 / 264

      const postCard: MovingoCard = {
        cardId: '2',
        cardType: 'movingo-year',
        price: 36500,
        purchaseDate: '2025-02-01',
        expiryDate: '2026-02-01',
      };
      expect(averageTripPrice(postCard)).toBe(100); // 36500 / 365
    });

    it('handles movingo-5-30 (same divisor pre/post)', () => {
      const card: MovingoCard = {
        cardId: '1',
        cardType: 'movingo-5-30',
        price: 1000,
        purchaseDate: '2025-03-01',
        expiryDate: '2025-04-01',
      };
      expect(averageTripPrice(card)).toBe(100); // 1000 / 10
    });
  });

  describe('compensationTier', () => {
    it('returns 0 for delays under 20 minutes', () => {
      expect(compensationTier(0, false)).toBe(0);
      expect(compensationTier(10, false)).toBe(0);
      expect(compensationTier(19, false)).toBe(0);
    });

    it('returns 50% for 20-39 minute delays', () => {
      expect(compensationTier(20, false)).toBe(0.5);
      expect(compensationTier(30, false)).toBe(0.5);
      expect(compensationTier(39, false)).toBe(0.5);
    });

    it('returns 75% for 40-59 minute delays', () => {
      expect(compensationTier(40, false)).toBe(0.75);
      expect(compensationTier(50, false)).toBe(0.75);
      expect(compensationTier(59, false)).toBe(0.75);
    });

    it('returns 100% for 60+ minute delays', () => {
      expect(compensationTier(60, false)).toBe(1.0);
      expect(compensationTier(120, false)).toBe(1.0);
    });

    it('returns 100% for cancelled trains regardless of delay', () => {
      expect(compensationTier(0, true)).toBe(1.0);
      expect(compensationTier(15, true)).toBe(1.0);
      expect(compensationTier(45, true)).toBe(1.0);
    });
  });

  describe('estimateCompensation', () => {
    const card: MovingoCard = {
      cardId: '1',
      cardType: 'movingo-30',
      price: 2200,
      purchaseDate: '2024-12-01',
      expiryDate: '2025-01-01',
    };

    it('returns 0 for non-claimable delays', () => {
      expect(estimateCompensation(15, false, card)).toBe(0);
    });

    it('calculates 50% compensation for 20-39 min delays', () => {
      // Trip price = 100, 50% = 50
      expect(estimateCompensation(25, false, card)).toBe(50);
    });

    it('calculates 75% compensation for 40-59 min delays', () => {
      // Trip price = 100, 75% = 75
      expect(estimateCompensation(45, false, card)).toBe(75);
    });

    it('calculates 100% compensation for 60+ min delays', () => {
      // Trip price = 100, 100% = 100
      expect(estimateCompensation(60, false, card)).toBe(100);
    });

    it('calculates 100% compensation for cancelled trains', () => {
      expect(estimateCompensation(0, true, card)).toBe(100);
    });

    it('rounds to nearest integer', () => {
      const oddCard: MovingoCard = {
        cardId: '1',
        cardType: 'movingo-30',
        price: 2201, // 2201 / 22 = 100.045...
        purchaseDate: '2024-12-01',
        expiryDate: '2025-01-01',
      };
      // 100.045 * 0.5 = 50.02... → rounds to 50
      expect(estimateCompensation(25, false, oddCard)).toBe(50);
    });
  });

  describe('isClaimable', () => {
    it('returns false for delays under 20 minutes', () => {
      expect(isClaimable(0, false)).toBe(false);
      expect(isClaimable(19, false)).toBe(false);
    });

    it('returns true for delays of 20+ minutes', () => {
      expect(isClaimable(20, false)).toBe(true);
      expect(isClaimable(60, false)).toBe(true);
    });

    it('returns true for cancelled trains regardless of delay', () => {
      expect(isClaimable(0, true)).toBe(true);
      expect(isClaimable(5, true)).toBe(true);
    });
  });

  describe('isLikelyScheduledChange', () => {
    it('returns false when no announcement timestamp', () => {
      expect(isLikelyScheduledChange(undefined, '2025-03-20T08:00:00')).toBe(false);
    });

    it('returns false when announced within 72 hours of departure', () => {
      // Announced 24 hours before
      expect(
        isLikelyScheduledChange('2025-03-19T08:00:00', '2025-03-20T08:00:00')
      ).toBe(false);

      // Announced exactly 72 hours before
      expect(
        isLikelyScheduledChange('2025-03-17T08:00:00', '2025-03-20T08:00:00')
      ).toBe(false);
    });

    it('returns true when announced more than 72 hours before departure', () => {
      // Announced 73 hours before
      expect(
        isLikelyScheduledChange('2025-03-17T07:00:00', '2025-03-20T08:00:00')
      ).toBe(true);

      // Announced a week before
      expect(
        isLikelyScheduledChange('2025-03-13T08:00:00', '2025-03-20T08:00:00')
      ).toBe(true);
    });
  });

  describe('buildDepartureDateTime', () => {
    it('combines date and time into ISO format', () => {
      expect(buildDepartureDateTime('2025-03-20', '08:30')).toBe('2025-03-20T08:30:00');
    });
  });

  describe('compensationLabel', () => {
    it('returns correct label for cancelled trains', () => {
      expect(compensationLabel(0, true)).toBe('Inställt — 100%');
    });

    it('returns correct label for 60+ min delays', () => {
      expect(compensationLabel(65, false)).toBe('65 min — 100%');
    });

    it('returns correct label for 40-59 min delays', () => {
      expect(compensationLabel(45, false)).toBe('45 min — 75%');
    });

    it('returns correct label for 20-39 min delays', () => {
      expect(compensationLabel(25, false)).toBe('25 min — 50%');
    });

    it('returns just minutes for non-claimable delays', () => {
      expect(compensationLabel(15, false)).toBe('15 min');
    });
  });
});
