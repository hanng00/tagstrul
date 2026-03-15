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
