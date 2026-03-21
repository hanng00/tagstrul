import { describe, it, expect } from 'bun:test'
import {
  formatPersonnummerLive,
  formatPersonnummer,
  luhnChecksum,
  validatePersonnummer,
} from './personnummer'

describe('personnummer', () => {
  describe('formatPersonnummerLive', () => {
    it('returns empty string for empty input', () => {
      expect(formatPersonnummerLive('')).toBe('')
    })

    it('strips non-digits', () => {
      expect(formatPersonnummerLive('19abc90')).toBe('1990')
    })

    it('returns digits without hyphen for 8 or fewer digits', () => {
      expect(formatPersonnummerLive('19900101')).toBe('19900101')
      expect(formatPersonnummerLive('1990')).toBe('1990')
    })

    it('adds hyphen after 8 digits', () => {
      expect(formatPersonnummerLive('199001011234')).toBe('19900101-1234')
      expect(formatPersonnummerLive('19900101123')).toBe('19900101-123')
    })

    it('limits to 12 digits', () => {
      expect(formatPersonnummerLive('1990010112345678')).toBe('19900101-1234')
    })
  })

  describe('formatPersonnummer', () => {
    it('formats 12-digit personnummer', () => {
      expect(formatPersonnummer('199001011234')).toBe('19900101-1234')
    })

    it('formats 10-digit personnummer', () => {
      expect(formatPersonnummer('9001011234')).toBe('900101-1234')
    })

    it('returns input unchanged for other lengths', () => {
      expect(formatPersonnummer('12345')).toBe('12345')
      expect(formatPersonnummer('12345678901')).toBe('12345678901')
    })

    it('handles input with existing hyphen', () => {
      expect(formatPersonnummer('19900101-1234')).toBe('19900101-1234')
    })
  })

  describe('luhnChecksum', () => {
    // Known valid personnummer last 10 digits
    it('returns true for valid Luhn sequence', () => {
      // 811228-9874 is a valid test personnummer
      expect(luhnChecksum('8112289874')).toBe(true)
    })

    it('returns false for invalid Luhn sequence', () => {
      expect(luhnChecksum('8112289875')).toBe(false)
      expect(luhnChecksum('0000000001')).toBe(false)
    })

    it('returns true for all zeros (edge case)', () => {
      expect(luhnChecksum('0000000000')).toBe(true)
    })
  })

  describe('validatePersonnummer', () => {
    it('returns invalid without error for empty input', () => {
      const result = validatePersonnummer('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeUndefined()
    })

    it('returns error for too short input', () => {
      const result = validatePersonnummer('123456789')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Personnumret är för kort')
    })

    it('returns error for invalid length (11 digits)', () => {
      const result = validatePersonnummer('12345678901')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Personnumret måste vara 10 eller 12 siffror')
    })

    it('returns error for invalid checksum', () => {
      const result = validatePersonnummer('199001011235') // Invalid check digit
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Personnumret är ogiltigt (felaktig kontrollsiffra)')
    })

    it('validates correct 12-digit personnummer', () => {
      // 19811228-9874 is valid
      const result = validatePersonnummer('198112289874')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('validates correct 10-digit personnummer', () => {
      // 811228-9874 is valid
      const result = validatePersonnummer('8112289874')
      expect(result.valid).toBe(true)
    })

    it('handles input with hyphen', () => {
      const result = validatePersonnummer('19811228-9874')
      expect(result.valid).toBe(true)
    })

    it('handles input with spaces', () => {
      const result = validatePersonnummer('1981 1228 9874')
      expect(result.valid).toBe(true)
    })
  })
})
