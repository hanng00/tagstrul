export interface Route {
  routeId: string
  fromStation: string
  fromStationUic?: string
  toStation: string
  toStationUic?: string
  departureTime?: string
}

export type MovingoCardType =
  | "movingo-30"
  | "movingo-90"
  | "movingo-year"
  | "movingo-5-30"

export interface MovingoCard {
  cardId: string
  movingoId: string
  cardType: MovingoCardType
  price: number
  purchaseDate: string
  expiryDate: string
}

export interface Delay {
  delayId: string
  routeId: string
  fromStation: string
  toStation: string
  date: string
  scheduledDeparture: string
  delayMinutes: number
  cancelled: boolean
  estimatedCompensation: number
  claimable: boolean
  claimed: boolean
  claimDeadline?: string
  dismissed?: boolean
  /** ISO timestamp when SJ announced the delay */
  announcedAt?: string
  /** ISO timestamp when we first detected this delay */
  firstSeenAt?: string
  /** Header/reason for the disruption from SJ */
  disruptionReason?: string
  /** True if announced >72h before departure — likely a scheduled change */
  likelyScheduledChange?: boolean
}

export interface Claim {
  claimId: string
  delayId: string
  fromStation: string
  toStation: string
  date: string
  scheduledDeparture: string
  delayMinutes: number
  estimatedCompensation: number
  status: "submitted" | "approved" | "rejected"
  submittedAt: string
  actualCompensation?: number
  resolvedAt?: string
}

export interface Profile {
  firstName?: string
  lastName?: string
  personalNumber?: string
  email?: string
  phone?: string
  swishPhone?: string
  onboardingComplete?: boolean
}

export const MOVINGO_CARD_LABELS: Record<MovingoCardType, string> = {
  "movingo-30": "Movingo 30 dagar",
  "movingo-90": "Movingo 90 dagar",
  "movingo-year": "Movingo År",
  "movingo-5-30": "Movingo 5/30",
}

/**
 * Movingo ID validation (matches SJ's "9 or 10 characters" requirement)
 * Format: alphanumeric, 9-10 characters (e.g., "BWTF8E962")
 */
export const MOVINGO_ID_REGEX = /^[A-Za-z0-9]{9,10}$/

export function isValidMovingoId(id: string): boolean {
  return MOVINGO_ID_REGEX.test(id)
}

export function getMovingoIdError(id: string): string | null {
  if (!id.trim()) return "Movingo-nummer krävs"
  if (id.length < 9) return "Movingo-nummer måste vara minst 9 tecken"
  if (id.length > 10) return "Movingo-nummer får vara max 10 tecken"
  if (!MOVINGO_ID_REGEX.test(id)) return "Movingo-nummer får bara innehålla bokstäver och siffror"
  return null
}
