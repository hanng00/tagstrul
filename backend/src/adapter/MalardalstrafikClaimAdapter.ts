import type { ClaimPort, ClaimTicket, ClaimJourney, ClaimContact, ClaimPayment } from '../ports/ClaimPort.ts';
import { malartagStationByUic } from '../data/malartag-stations.ts';

/**
 * Files claims with Mälardalstrafik's delay compensation form ("EVF", run by Precio), the
 * form Movingo holders use for Mälartåg trains. Its web app talks to a small JSON API, and
 * this adapter makes the same calls. Mapped from web app version 2.7.1.160 on 2026-11-27.
 *
 * The form's API files a claim in a single POST, so the earlier steps only collect details.
 * They travel in the session, which is base64url JSON the web app carries between steps.
 */

const BASE_URL = 'https://evf-regionsormland.preciocloudapp.net/api';
const ZERO_ID = '00000000-0000-0000-0000-000000000000';

/** The form's ticket type for Movingo (both "Movingo via Mälardalstrafik" and "Movingo via SJ"). */
const TICKET_TYPE_MOVINGO = '1';
/** The form's default refund type; it is sent as is for Swish payouts too. */
const REFUND_TYPE = 'Payment via Swedbank SUS';
const PAYOUT_SWISH = 'SWISH';

interface ApiResult<T> {
  isSuccess: boolean;
  errorMessage?: string | null;
  data?: T;
}

interface Session {
  ticket: ClaimTicket;
  journey: ClaimJourney;
  departureStationId: string;
  arrivalStationId: string;
  trainNumber: number;
  contact?: ClaimContact;
  payment?: ClaimPayment;
}

export class MalardalstrafikClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalardalstrafikClaimError';
  }
}

function encode(session: Session): string {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

function decode(session: string): Session {
  try {
    return JSON.parse(Buffer.from(session, 'base64url').toString('utf8')) as Session;
  } catch {
    throw new MalardalstrafikClaimError('Invalid claim session');
  }
}

/** The form sends the local departure time as if it were UTC, e.g. 07:08 → "…T07:08:00.000Z". */
export function formDepartureDate(date: string, time: string): string {
  return `${date}T${time}:00.000Z`;
}

/** The form's mobile number format: country code 46, then the number without its leading zero. */
export function formMobileNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('46')) return digits;
  return `46${digits.replace(/^0/, '')}`;
}

export class MalardalstrafikClaimAdapter implements ClaimPort {
  readonly id = 'malardalstrafik' as const;

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  private async call<T>(path: string, init?: { method: 'POST'; body: unknown }): Promise<ApiResult<T>> {
    const response = await this.fetchImpl(`${BASE_URL}/${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        accept: 'application/json;charset=UTF-8',
        'content-type': 'application/json;charset=UTF-8',
        csrf: 'token',
        origin: 'https://evf-regionsormland.preciocloudapp.net',
        referer: 'https://evf-regionsormland.preciocloudapp.net/trains/evf',
      },
      body: init ? JSON.stringify(init.body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[Malardalstrafik] ${response.status} on ${path}: ${text}`);
      throw new MalardalstrafikClaimError(`Mälardalstrafik returned ${response.status}`);
    }
    return (await response.json()) as ApiResult<T>;
  }

  async start(ticket: ClaimTicket, journey: ClaimJourney): Promise<{ session: string; eligible: boolean }> {
    const from = malartagStationByUic(journey.fromStationUic);
    const to = malartagStationByUic(journey.toStationUic);
    if (!from || !to) {
      throw new MalardalstrafikClaimError(`${journey.fromStation} → ${journey.toStation} is not on the Mälartåg network`);
    }

    const departureDate = formDepartureDate(journey.date, journey.departureTime);
    const ticketNumber = ticket.cardNumber.trim().toUpperCase();

    const duplicate = await this.call<boolean>('Claims/CheckDuplicate', {
      method: 'POST',
      body: { departureStationId: from.claimStationId, arrivalStationId: to.claimStationId, departureDate, ticketNumber },
    });
    if (duplicate.isSuccess && duplicate.data === true) {
      return { session: '', eligible: false };
    }

    // The form looks up Trafikverket's train id for the departure and sends 0 when it finds none.
    // We already know the train number, so we fall back to ours.
    const distance = await this.call<{ trafikverketTrainId?: number }>(
      `TrainStations/GetDistance?departureStationId=${encodeURIComponent(from.signature)}&arrivalStationId=${encodeURIComponent(to.signature)}&departureDate=${departureDate}`,
    ).catch(() => undefined);
    const trainNumber = distance?.data?.trafikverketTrainId || Number(journey.trainNumber) || 0;

    const session: Session = {
      ticket: { ...ticket, cardNumber: ticketNumber },
      journey,
      departureStationId: from.claimStationId,
      arrivalStationId: to.claimStationId,
      trainNumber,
    };
    return { session: encode(session), eligible: true };
  }

  async submitContact(session: string, contact: ClaimContact): Promise<{ session: string }> {
    return { session: encode({ ...decode(session), contact }) };
  }

  async submitPayment(session: string, payment: ClaimPayment): Promise<{ session: string; paymentRef: string }> {
    return { session: encode({ ...decode(session), payment }), paymentRef: PAYOUT_SWISH };
  }

  /** The claim body, exactly as the form's web app builds it for a Movingo claim with Swish payout. */
  static claimBody(s: Session): Record<string, unknown> {
    if (!s.contact || !s.payment) throw new MalardalstrafikClaimError('Contact and payment details are missing');
    return {
      id: ZERO_ID,
      confirmDuplicate: null,
      payoutOption: PAYOUT_SWISH,
      customer: {
        id: ZERO_ID,
        firstName: s.contact.firstName,
        surName: s.contact.lastName,
        city: '',
        postalCode: '',
        streetNameAndNumber: '',
        identityNumber: s.payment.personalNumber.trim(),
        bankAccountNumber: '',
        mobileNumber: formMobileNumber(s.payment.swishPhone),
        email: s.contact.email.trim(),
        clearingNumber: '',
        hasIdentityNumber: true,
        IBAN: '',
        BIC: '',
      },
      ticketNumber: s.ticket.cardNumber,
      ticketType: TICKET_TYPE_MOVINGO,
      departureStationId: s.departureStationId,
      arrivalStationId: s.arrivalStationId,
      departureDate: formDepartureDate(s.journey.date, s.journey.departureTime),
      comment: '',
      status: 0,
      trainNumber: s.trainNumber,
      refundType: { id: ZERO_ID, name: REFUND_TYPE },
      claimReceipts: [],
    };
  }

  async confirm(session: string, _paymentRef: string): Promise<{ confirmationId: string }> {
    const result = await this.call<unknown>('Claims', { method: 'POST', body: MalardalstrafikClaimAdapter.claimBody(decode(session)) });
    if (!result.isSuccess) {
      throw new MalardalstrafikClaimError(result.errorMessage || 'Mälardalstrafik rejected the claim');
    }
    return { confirmationId: confirmationIdOf(result.data) };
  }
}

/** The response's data is not documented. Take a case number or id when there is one. */
function confirmationIdOf(data: unknown): string {
  if (typeof data === 'string' || typeof data === 'number') return String(data);
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    for (const key of ['caseNumber', 'CaseNumber', 'claimNumber', 'id', 'Id']) {
      if (d[key] !== undefined && d[key] !== null && d[key] !== ZERO_ID) return String(d[key]);
    }
  }
  return '';
}
