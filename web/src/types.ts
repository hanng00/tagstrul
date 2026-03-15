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
