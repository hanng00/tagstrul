/**
 * Extract date key (YYYY-MM-DD) from ISO string.
 */
export function toDateKey(iso: string | undefined): string {
  if (!iso) return ''
  return iso.split('T')[0] ?? ''
}

/**
 * Check if a departure time has passed.
 * @param date Date in YYYY-MM-DD format
 * @param time Time in HH:MM format
 * @param now Optional current time for testing
 */
export function hasDeparturePassed(
  date: string | undefined,
  time: string | undefined,
  now: number = Date.now()
): boolean {
  if (!date || !time) return false
  const departure = new Date(`${date}T${time}:00`)
  return departure.getTime() < now
}

/**
 * Calculate days until a deadline.
 * @param deadline ISO date string or Date
 * @param now Optional current time for testing
 * @returns Number of days (negative if past)
 */
export function daysUntil(
  deadline: string | Date,
  now: Date = new Date()
): number {
  const target = typeof deadline === 'string' ? new Date(deadline) : deadline
  const diffMs = target.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
