import type { Claim, Delay, MovingoCard, Profile, Route } from "@/types"

/**
 * Sample data for /storybook. Dates are relative to today so the
 * screens always look current. Nothing here touches the real API.
 */

function isoDay(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const routes: Route[] = [
  { routeId: "r1", fromStation: "Uppsala C", toStation: "Stockholm C", departureTime: "07:12" },
  { routeId: "r2", fromStation: "Stockholm C", toStation: "Uppsala C", departureTime: "17:40" },
]

function delay(partial: Partial<Delay> & Pick<Delay, "delayId">): Delay {
  return {
    routeId: "r1",
    fromStation: "Uppsala C",
    toStation: "Stockholm C",
    date: isoDay(-1),
    scheduledDeparture: "07:12",
    delayMinutes: 42,
    cancelled: false,
    estimatedCompensation: 85,
    claimable: true,
    claimed: false,
    claimDeadline: isoDay(80),
    ...partial,
  }
}

export const delays = {
  late42Urgent: delay({ delayId: "d1", claimDeadline: isoDay(4) }),
  cancelled: delay({
    delayId: "d2",
    routeId: "r2",
    fromStation: "Stockholm C",
    toStation: "Uppsala C",
    scheduledDeparture: "17:40",
    date: isoDay(-2),
    delayMinutes: 0,
    cancelled: true,
    estimatedCompensation: 170,
  }),
  late24: delay({ delayId: "d3", date: isoDay(-1), delayMinutes: 24, estimatedCompensation: 42 }),
  hidden: delay({ delayId: "d4", date: isoDay(-6), dismissed: true, delayMinutes: 31 }),
  claimed: delay({ delayId: "d5", date: isoDay(-9), claimed: true, delayMinutes: 65, estimatedCompensation: 170 }),
}

export const claims: Claim[] = [
  {
    claimId: "c1",
    delayId: "d5",
    fromStation: "Uppsala C",
    toStation: "Stockholm C",
    date: isoDay(-9),
    scheduledDeparture: "07:12",
    delayMinutes: 65,
    estimatedCompensation: 170,
    status: "submitted",
    submittedAt: isoDay(-8),
  },
  {
    claimId: "c2",
    delayId: "d6",
    fromStation: "Stockholm C",
    toStation: "Uppsala C",
    date: isoDay(-20),
    scheduledDeparture: "17:40",
    delayMinutes: 31,
    estimatedCompensation: 85,
    actualCompensation: 85,
    status: "approved",
    submittedAt: isoDay(-19),
    resolvedAt: isoDay(-12),
  },
]

export const profile: Profile = {
  firstName: "Alva",
  lastName: "Pendlare",
  email: "alva@example.com",
  phone: "0701234567",
  swishPhone: "0701234567",
  personalNumber: "199001011239",
  onboardingComplete: true,
}

export function movingoCard(daysLeft: number, price = 2650): MovingoCard {
  return {
    cardId: `m${daysLeft}`,
    movingoId: "BWTF8E962",
    cardType: "movingo-30",
    price,
    purchaseDate: isoDay(daysLeft - 30),
    expiryDate: isoDay(daysLeft),
  }
}

export interface Scenario {
  label: string
  delays: Delay[]
  claims: Claim[]
  routes: Route[]
  cards: MovingoCard[]
}

export const scenarios = {
  inbox: {
    label: "Resor att kräva",
    delays: [delays.late42Urgent, delays.cancelled, delays.late24, delays.hidden, delays.claimed],
    claims,
    routes,
    cards: [movingoCard(20)],
  },
  allClear: {
    label: "Allt krävt",
    delays: [delays.claimed],
    claims,
    routes,
    cards: [movingoCard(3)],
  },
  newUser: {
    label: "Ny användare",
    delays: [],
    claims: [],
    routes: [],
    cards: [],
  },
} satisfies Record<string, Scenario>

export type ScenarioId = keyof typeof scenarios
