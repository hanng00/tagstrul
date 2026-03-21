import { describe, it, expect } from 'bun:test'
import { toDateKey, hasDeparturePassed, daysUntil } from './date-utils'

describe('date-utils', () => {
  describe('toDateKey', () => {
    it('extracts date from ISO string', () => {
      expect(toDateKey('2025-03-20T08:30:00')).toBe('2025-03-20')
      expect(toDateKey('2025-03-20T08:30:00.000Z')).toBe('2025-03-20')
    })

    it('returns empty string for undefined', () => {
      expect(toDateKey(undefined)).toBe('')
    })

    it('handles date-only string', () => {
      expect(toDateKey('2025-03-20')).toBe('2025-03-20')
    })
  })

  describe('hasDeparturePassed', () => {
    const fixedNow = new Date('2025-03-20T10:00:00').getTime()

    it('returns false for undefined date or time', () => {
      expect(hasDeparturePassed(undefined, '08:00', fixedNow)).toBe(false)
      expect(hasDeparturePassed('2025-03-20', undefined, fixedNow)).toBe(false)
      expect(hasDeparturePassed(undefined, undefined, fixedNow)).toBe(false)
    })

    it('returns true for past departure', () => {
      expect(hasDeparturePassed('2025-03-20', '08:00', fixedNow)).toBe(true)
      expect(hasDeparturePassed('2025-03-19', '18:00', fixedNow)).toBe(true)
    })

    it('returns false for future departure', () => {
      expect(hasDeparturePassed('2025-03-20', '12:00', fixedNow)).toBe(false)
      expect(hasDeparturePassed('2025-03-21', '08:00', fixedNow)).toBe(false)
    })

    it('returns false for exact current time', () => {
      // 10:00:00 is not < 10:00:00
      expect(hasDeparturePassed('2025-03-20', '10:00', fixedNow)).toBe(false)
    })
  })

  describe('daysUntil', () => {
    const today = new Date('2025-03-20T12:00:00')

    it('returns correct values for same day', () => {
      expect(daysUntil('2025-03-20T23:59:59', today)).toBe(1) // ceil rounds up partial day
      // 00:00 is 12 hours before noon, ceil(-0.5) = -0, which equals 0
      expect(daysUntil('2025-03-20T00:00:00', today)).toBe(-0)
      expect(daysUntil('2025-03-20T12:00:00', today)).toBe(0) // exact same time
    })

    it('returns positive for future dates', () => {
      expect(daysUntil('2025-03-21T12:00:00', today)).toBe(1)
      expect(daysUntil('2025-03-25T12:00:00', today)).toBe(5)
    })

    it('returns negative for past dates', () => {
      expect(daysUntil('2025-03-19T12:00:00', today)).toBe(-1)
      expect(daysUntil('2025-03-15T12:00:00', today)).toBe(-5)
    })

    it('accepts Date object', () => {
      const deadline = new Date('2025-03-25T12:00:00')
      expect(daysUntil(deadline, today)).toBe(5)
    })
  })
})
