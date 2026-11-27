import type { ClaimPort, ClaimTicket, ClaimJourney, ClaimContact, ClaimPayment } from '../ports/ClaimPort.ts';
import {
  getDelayCompensationToken,
  submitTravelDetails,
  submitContactInfo,
  submitBankDetails,
  confirmClaim,
  MOVINGO_CARD_TYPE_LABELS,
} from './SJDelayCompensationAdapter.ts';

/** Files claims through SJ's delay compensation API. The session is SJ's delayCompensationToken. */
export class SJClaimAdapter implements ClaimPort {
  readonly id = 'sj' as const;

  async start(ticket: ClaimTicket, journey: ClaimJourney): Promise<{ session: string; eligible: boolean }> {
    const cardTypeLabel = MOVINGO_CARD_TYPE_LABELS[ticket.cardType] ?? 'Movingo 30 dgr på SJ kort';
    const token = await getDelayCompensationToken(ticket.cardNumber, cardTypeLabel);

    const { token: session, ticketCompensation } = await submitTravelDetails(token, {
      journeyDetail: {
        departureLocation: { id: journey.fromStationUic, name: journey.fromStation },
        arrivalLocation: { id: journey.toStationUic, name: journey.toStation },
        journeyDate: { date: journey.date },
        journeyTime: { time: journey.departureTime },
        trainNumber: journey.trainNumber,
      },
      expenses: [],
    });

    return { session, eligible: ticketCompensation };
  }

  async submitContact(session: string, contact: ClaimContact): Promise<{ session: string }> {
    const next = await submitContactInfo(session, {
      emailAddress: contact.email,
      mobilePhoneNumber: contact.phone,
      personName: { firstName: contact.firstName, lastName: contact.lastName },
    });
    return { session: next };
  }

  async submitPayment(session: string, payment: ClaimPayment): Promise<{ session: string; paymentRef: string }> {
    const barId = await submitBankDetails(session, {
      personalIdentityNumber: payment.personalNumber,
      swishPhoneNumber: payment.swishPhone,
    });
    return { session, paymentRef: barId };
  }

  async confirm(session: string, paymentRef: string): Promise<{ confirmationId: string }> {
    return { confirmationId: await confirmClaim(session, paymentRef) };
  }
}
