import { describe, expect, test } from 'bun:test';
import { MalardalstrafikClaimAdapter, formMobileNumber, formDepartureDate } from './MalardalstrafikClaimAdapter.ts';

type Call = { url: string; method: string; body?: unknown; headers: Record<string, string> };

function fakeApi(responses: Record<string, unknown>) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined, headers: init.headers as Record<string, string> });
    const path = String(url).replace('https://evf-regionsormland.preciocloudapp.net/api/', '').split('?')[0]!;
    return new Response(JSON.stringify(responses[path] ?? { isSuccess: true }), { status: 200 });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const ticket = { kind: 'movingo' as const, cardNumber: 'b12345678', cardType: 'movingo-30' as const };
const journey = {
  fromStation: 'Uppsala C', fromStationUic: '740000005',
  toStation: 'Stockholm C', toStationUic: '740000001',
  date: '2026-11-25', departureTime: '07:08', trainNumber: '10912',
};
const contact = { firstName: 'Anna', lastName: 'Andersson', email: ' anna@example.se ', phone: '0701234567' };
const payment = { personalNumber: '19900101-1234', swishPhone: '070-123 45 67' };

describe('form formats', () => {
  test('sends the local departure time marked as UTC, like the form', () => {
    expect(formDepartureDate('2026-11-25', '07:08')).toBe('2026-11-25T07:08:00.000Z');
  });

  test('formats mobile numbers with country code 46 and no leading zero', () => {
    expect(formMobileNumber('0701234567')).toBe('46701234567');
    expect(formMobileNumber('+46701234567')).toBe('46701234567');
    expect(formMobileNumber('070-123 45 67')).toBe('46701234567');
  });
});

describe('MalardalstrafikClaimAdapter', () => {
  test('files a Movingo claim with Swish payout in one POST at the end', async () => {
    const { calls, fetchImpl } = fakeApi({
      'Claims/CheckDuplicate': { isSuccess: true, data: false },
      'TrainStations/GetDistance': { isSuccess: true, data: { distance: 63.1, isShortTrain: true, trafikverketTrainId: 0 } },
      Claims: { isSuccess: true, data: { caseNumber: 'EVF-123' } },
    });
    const evf = new MalardalstrafikClaimAdapter(fetchImpl);

    const started = await evf.start(ticket, journey);
    expect(started.eligible).toBe(true);
    expect(calls[0]).toMatchObject({
      url: 'https://evf-regionsormland.preciocloudapp.net/api/Claims/CheckDuplicate',
      method: 'POST',
      body: {
        departureStationId: 'cf09cbb1-fd82-4b83-9c09-87bc8fc2f018',
        arrivalStationId: 'f4d25596-a9f9-41a1-b200-713439d92fc4',
        departureDate: '2026-11-25T07:08:00.000Z',
        ticketNumber: 'B12345678',
      },
    });
    expect(calls[0]!.headers.csrf).toBe('token');
    expect(calls[1]!.url).toContain('TrainStations/GetDistance?departureStationId=U&arrivalStationId=Cst&departureDate=2026-11-25T07:08:00.000Z');

    const afterContact = await evf.submitContact(started.session, contact);
    const afterPayment = await evf.submitPayment(afterContact.session, payment);
    expect(calls).toHaveLength(2);

    const confirmed = await evf.confirm(afterPayment.session, afterPayment.paymentRef);
    expect(confirmed).toEqual({ confirmationId: 'EVF-123' });

    const claim = calls[2]!;
    expect(claim.url).toBe('https://evf-regionsormland.preciocloudapp.net/api/Claims');
    expect(claim.body).toMatchObject({
      payoutOption: 'SWISH',
      ticketNumber: 'B12345678',
      ticketType: '1',
      departureStationId: 'cf09cbb1-fd82-4b83-9c09-87bc8fc2f018',
      arrivalStationId: 'f4d25596-a9f9-41a1-b200-713439d92fc4',
      departureDate: '2026-11-25T07:08:00.000Z',
      trainNumber: 10912,
      status: 0,
      claimReceipts: [],
      refundType: { name: 'Payment via Swedbank SUS' },
      customer: {
        firstName: 'Anna',
        surName: 'Andersson',
        email: 'anna@example.se',
        identityNumber: '19900101-1234',
        mobileNumber: '46701234567',
        hasIdentityNumber: true,
      },
    });
  });

  test('prefers the train id the form looks up from Trafikverket', async () => {
    const { calls, fetchImpl } = fakeApi({
      'Claims/CheckDuplicate': { isSuccess: true, data: false },
      'TrainStations/GetDistance': { isSuccess: true, data: { trafikverketTrainId: 10914 } },
    });
    const evf = new MalardalstrafikClaimAdapter(fetchImpl);
    const s1 = await evf.start(ticket, journey);
    const s2 = await evf.submitContact(s1.session, contact);
    const s3 = await evf.submitPayment(s2.session, payment);
    await evf.confirm(s3.session, s3.paymentRef);
    expect((calls[2]!.body as { trainNumber: number }).trainNumber).toBe(10914);
  });

  test('reports a duplicate claim as not eligible', async () => {
    const { fetchImpl } = fakeApi({ 'Claims/CheckDuplicate': { isSuccess: true, data: true } });
    expect((await new MalardalstrafikClaimAdapter(fetchImpl).start(ticket, journey)).eligible).toBe(false);
  });

  test('refuses stations outside the Mälartåg network', async () => {
    const { fetchImpl } = fakeApi({});
    await expect(new MalardalstrafikClaimAdapter(fetchImpl).start(ticket, { ...journey, toStationUic: '740000002' })).rejects.toThrow('not on the Mälartåg network');
  });

  test('throws when the form rejects the claim', async () => {
    const { fetchImpl } = fakeApi({
      'Claims/CheckDuplicate': { isSuccess: true, data: false },
      Claims: { isSuccess: false, errorMessage: 'max_number_of_claims_reached' },
    });
    const evf = new MalardalstrafikClaimAdapter(fetchImpl);
    const s1 = await evf.start(ticket, journey);
    const s3 = await evf.submitPayment((await evf.submitContact(s1.session, contact)).session, payment);
    await expect(evf.confirm(s3.session, s3.paymentRef)).rejects.toThrow('max_number_of_claims_reached');
  });
});
