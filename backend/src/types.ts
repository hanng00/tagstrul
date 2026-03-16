export interface Route {
  routeId: string;
  fromStation: string;
  fromStationUic: string;
  toStation: string;
  toStationUic: string;
  departureTime?: string;
}

export type MovingoCardType = 'movingo-30' | 'movingo-90' | 'movingo-year' | 'movingo-5-30';

export interface MovingoCard {
  cardId: string;
  movingoId: string;
  cardType: MovingoCardType;
  price: number;
  purchaseDate: string;
  expiryDate: string;
}

export interface Delay {
  delayId: string;
  routeId: string;
  fromStation: string;
  toStation: string;
  date: string;
  scheduledDeparture: string;
  delayMinutes: number;
  cancelled: boolean;
  estimatedCompensation: number;
  claimable: boolean;
  claimed: boolean;
  claimDeadline?: string;
  dismissed?: boolean;
  /** ISO timestamp when SJ announced the delay (from xodRemarks.editedDate) */
  announcedAt?: string;
  /** ISO timestamp when we first detected this delay */
  firstSeenAt?: string;
  /** Header/reason for the disruption from SJ */
  disruptionReason?: string;
  /** True if announced >72h before departure — likely a scheduled change, not eligible for delay compensation */
  likelyScheduledChange?: boolean;
}

export interface Claim {
  claimId: string;
  delayId: string;
  fromStation: string;
  toStation: string;
  date: string;
  scheduledDeparture: string;
  delayMinutes: number;
  estimatedCompensation: number;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt: string;
  actualCompensation?: number;
  resolvedAt?: string;
}

export interface Profile {
  firstName?: string;
  lastName?: string;
  personalNumber?: string;
  email?: string;
  phone?: string;
  swishPhone?: string;
  onboardingComplete?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
