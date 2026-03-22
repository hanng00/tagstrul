function formatPhoneLive(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10)
  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
}

export function formatPhone(input: string): string {
  return formatPhoneLive(input)
}

export function getPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, "")
}

export { formatPhoneLive }
