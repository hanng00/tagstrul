/**
 * Format personnummer for live input (as user types).
 * Adds hyphen after 8 digits.
 */
export function formatPersonnummerLive(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 12)
  if (digits.length > 8) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  return digits
}

/**
 * Format a complete personnummer for display.
 * Handles both 10-digit (YYMMDD-XXXX) and 12-digit (YYYYMMDD-XXXX) formats.
 */
export function formatPersonnummer(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 12) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`
  }
  return input
}

/**
 * Luhn checksum validation (mod 10 algorithm).
 * Used by Swedish personnummer for the control digit.
 */
export function luhnChecksum(digits: string): boolean {
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = parseInt(digits[i]!, 10)
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate a Swedish personnummer.
 * Accepts both 10-digit (YYMMDD-XXXX) and 12-digit (YYYYMMDD-XXXX) formats.
 */
export function validatePersonnummer(input: string): ValidationResult {
  const digits = input.replace(/\D/g, '')

  if (digits.length === 0) {
    return { valid: false }
  }

  if (digits.length < 10) {
    return { valid: false, error: 'Personnumret är för kort' }
  }

  if (digits.length !== 10 && digits.length !== 12) {
    return { valid: false, error: 'Personnumret måste vara 10 eller 12 siffror' }
  }

  // For Luhn, we use the last 10 digits (YYMMDD-XXXX)
  const luhnDigits = digits.length === 12 ? digits.slice(2) : digits

  if (!luhnChecksum(luhnDigits)) {
    return { valid: false, error: 'Personnumret är ogiltigt (felaktig kontrollsiffra)' }
  }

  return { valid: true }
}
