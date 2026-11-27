import type { ClaimProviderId } from '../domain/claims.ts';
import type { MovingoCardType } from '../types.ts';

export interface ClaimJourney {
  fromStation: string;
  fromStationUic: string;
  toStation: string;
  toStationUic: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, scheduled departure */
  departureTime: string;
  trainNumber: string;
}

export interface ClaimTicket {
  kind: 'movingo';
  cardNumber: string;
  cardType: MovingoCardType;
}

export interface ClaimContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ClaimPayment {
  /** Formatted personal identity number, YYYYMMDD-XXXX or YYMMDD-XXXX */
  personalNumber: string;
  swishPhone: string;
}

/**
 * Driven port: files a delay compensation claim with one provider.
 *
 * Claims are filed in four steps so the user can review contact and payment details
 * in between. `session` is the provider's own opaque state for the claim in progress;
 * each step returns the session to pass to the next one.
 */
export interface ClaimPort {
  readonly id: ClaimProviderId;

  /** Opens a claim. `eligible` is false when the provider says the trip gives no compensation. */
  start(ticket: ClaimTicket, journey: ClaimJourney): Promise<{ session: string; eligible: boolean }>;

  submitContact(session: string, contact: ClaimContact): Promise<{ session: string }>;

  /** Registers where to pay out. `paymentRef` must be passed to confirm. */
  submitPayment(session: string, payment: ClaimPayment): Promise<{ session: string; paymentRef: string }>;

  /** Files the claim. Returns the provider's reference for it. */
  confirm(session: string, paymentRef: string): Promise<{ confirmationId: string }>;
}
