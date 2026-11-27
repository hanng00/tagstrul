import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { SJClaimAdapter } from './SJClaimAdapter.ts';

type Call = { url: string; method: string; body: string };

let calls: Call[];
let responses: unknown[];
const realFetch = globalThis.fetch;

beforeEach(() => {
  calls = [];
  responses = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: String(init.body ?? '') });
    return new Response(JSON.stringify(responses.shift() ?? {}), { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

const BASE = 'https://prod-api.adp.sj.se/public/delay-compensation/v1/compensation';

describe('SJClaimAdapter', () => {
  const sj = new SJClaimAdapter();

  test('start opens a token with the Movingo card, then sends the journey', async () => {
    responses.push(
      { delayCompensationToken: 'tok1', existingServiceRequests: [], eligibleOrderItems: [] },
      { delayCompensationToken: 'tok2', bankAccountInfoRequirement: { requirementReason: [], ticketCompensation: true, expensesCompensation: false } },
    );

    const result = await sj.start(
      { kind: 'movingo', cardNumber: 'M123', cardType: 'movingo-90' },
      {
        fromStation: 'Uppsala C', fromStationUic: '740000005',
        toStation: 'Stockholm C', toStationUic: '740000001',
        date: '2026-11-20', departureTime: '07:12', trainNumber: '10912',
      },
    );

    expect(result).toEqual({ session: 'tok2', eligible: true });
    expect(calls[0]!.url).toBe(`${BASE}/delaycompensationtokens`);
    expect(JSON.parse(calls[0]!.body)).toMatchObject({ commuterCardNumber: 'M123', commuterCardType: 'Movingo 90 dgr på SJ kort' });
    expect(calls[1]!.url).toBe(`${BASE}/tok1/traveldetails`);
    expect(calls[1]!.method).toBe('PUT');
    expect(calls[1]!.body).toContain('"trainNumber":"10912"');
    expect(calls[1]!.body).toContain('"departureLocation":{"id":"740000005","name":"Uppsala C"}');
  });

  test('start reports ineligible trips', async () => {
    responses.push(
      { delayCompensationToken: 'tok1' },
      { delayCompensationToken: 'tok2', bankAccountInfoRequirement: { requirementReason: [], ticketCompensation: false, expensesCompensation: false } },
    );
    const result = await sj.start(
      { kind: 'movingo', cardNumber: 'M1', cardType: 'movingo-30' },
      { fromStation: 'A', fromStationUic: '1', toStation: 'B', toStationUic: '2', date: '2026-11-20', departureTime: '07:00', trainNumber: '1' },
    );
    expect(result.eligible).toBe(false);
  });

  test('contact, payment and confirm map to SJ field names', async () => {
    responses.push({ delayCompensationToken: 'tok3' }, { barId: 'bar9' }, { ticketCompensationServiceRequests: ['SR-1'] });

    expect(await sj.submitContact('tok2', { firstName: 'A', lastName: 'B', email: 'a@b.se', phone: '0701234567' })).toEqual({ session: 'tok3' });
    expect(JSON.parse(calls[0]!.body)).toEqual({ emailAddress: 'a@b.se', mobilePhoneNumber: '0701234567', personName: { firstName: 'A', lastName: 'B' } });

    expect(await sj.submitPayment('tok3', { personalNumber: '19900101-1234', swishPhone: '0701234567' })).toEqual({ session: 'tok3', paymentRef: 'bar9' });
    expect(JSON.parse(calls[1]!.body)).toEqual({ personalIdentityNumber: '19900101-1234', swishPhoneNumber: '0701234567' });

    expect(await sj.confirm('tok3', 'bar9')).toEqual({ confirmationId: 'SR-1' });
    expect(calls[2]!.url).toBe(`${BASE}/tok3/confirmations`);
    expect(JSON.parse(calls[2]!.body)).toEqual({ paynovaBarIds: { ticketCompensation: 'bar9' } });
  });
});
