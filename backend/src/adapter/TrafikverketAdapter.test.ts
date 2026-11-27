import { describe, expect, test } from 'bun:test';
import { TrafikverketAdapter, buildRequestBody, joinAnnouncements, operatorOf, type TrainAnnouncement } from './TrafikverketAdapter.ts';

const route = { from: 'Uppsala C', fromUic: '740000005', to: 'Stockholm C', toUic: '740000001' };

const dep = (over: Partial<TrainAnnouncement> = {}): TrainAnnouncement => ({
  ActivityType: 'Avgang',
  AdvertisedTrainIdent: '10912',
  AdvertisedTimeAtLocation: '2026-11-25T07:08:00.000+01:00',
  LocationSignature: 'U',
  ScheduledDepartureDateTime: '2026-11-25T00:00:00.000+01:00',
  ProductInformation: [{ Code: 'PNA054', Description: 'Mälartåg' }],
  InformationOwner: 'Mälardalstrafik',
  Operator: 'VR',
  ...over,
});

const arr = (over: Partial<TrainAnnouncement> = {}): TrainAnnouncement => ({
  ...dep(),
  ActivityType: 'Ankomst',
  AdvertisedTimeAtLocation: '2026-11-25T07:46:00.000+01:00',
  LocationSignature: 'Cst',
  ...over,
});

describe('buildRequestBody', () => {
  test('asks for departures at the origin and arrivals at the destination', () => {
    const body = buildRequestBody('KEY', 'U', 'Cst', '2026-11-25');
    expect(body).toContain('<LOGIN authenticationkey="KEY" />');
    expect(body).toContain('<EQ name="ActivityType" value="Avgang" /><EQ name="LocationSignature" value="U" />');
    expect(body).toContain('<EQ name="ActivityType" value="Ankomst" /><EQ name="LocationSignature" value="Cst" />');
    expect(body).toContain('<GTE name="AdvertisedTimeAtLocation" value="2026-11-25T00:00:00" />');
    expect(body).toContain('<LT name="AdvertisedTimeAtLocation" value="2026-11-26T04:00:00" />');
  });

  test('escapes the key', () => {
    expect(buildRequestBody('a"b', 'U', 'Cst', '2026-11-25')).toContain('authenticationkey="a&#34;b"');
  });
});

describe('operatorOf', () => {
  test('reads Mälartåg from the product name', () => {
    expect(operatorOf(dep())).toBe('malartag');
  });

  test('falls back to the information owner, then the operator', () => {
    expect(operatorOf(dep({ ProductInformation: [], InformationOwner: 'SJ' }))).toBe('sj');
    expect(operatorOf(dep({ ProductInformation: undefined, InformationOwner: undefined, Operator: 'SJ' }))).toBe('sj');
    expect(operatorOf(dep({ ProductInformation: [{ Description: 'Pendeltåg' }], InformationOwner: 'SL', Operator: 'MTR' }))).toBe('unknown');
  });
});

describe('joinAnnouncements', () => {
  test('measures delay at arrival', () => {
    const [run] = joinAnnouncements(route, '2026-11-25', [dep({ TimeAtLocation: '2026-11-25T07:10:00.000+01:00' })], [
      arr({ TimeAtLocation: '2026-11-25T08:11:00.000+01:00' }),
    ]);
    expect(run).toMatchObject({
      trainId: '10912',
      fromStation: 'Uppsala C',
      toStation: 'Stockholm C',
      date: '2026-11-25',
      scheduledDeparture: '07:08',
      actualDeparture: '07:10',
      delayMinutes: 25,
      cancelled: false,
      source: 'trafikverket',
      operator: 'malartag',
    });
  });

  test('uses the estimate before the train has arrived', () => {
    const [run] = joinAnnouncements(route, '2026-11-25', [dep()], [arr({ EstimatedTimeAtLocation: '2026-11-25T08:30:00.000+01:00' })]);
    expect(run!.delayMinutes).toBe(44);
  });

  test('counts early arrivals as no delay', () => {
    const [run] = joinAnnouncements(route, '2026-11-25', [dep()], [arr({ TimeAtLocation: '2026-11-25T07:43:00.000+01:00' })]);
    expect(run!.delayMinutes).toBe(0);
  });

  test('marks the run cancelled when either end is cancelled', () => {
    expect(joinAnnouncements(route, '2026-11-25', [dep()], [arr({ Canceled: true })])[0]!.cancelled).toBe(true);
    expect(joinAnnouncements(route, '2026-11-25', [dep({ Canceled: true })], [arr()])[0]!.cancelled).toBe(true);
  });

  test('keeps the deviation text as the disruption reason', () => {
    const [run] = joinAnnouncements(route, '2026-11-25', [dep()], [arr({ Deviation: [{ Code: 'ANA027', Description: 'Signalfel' }] })]);
    expect(run!.disruptionReason).toBe('Signalfel');
  });

  test('skips trains that do not reach the destination, or go the other way', () => {
    expect(joinAnnouncements(route, '2026-11-25', [dep()], [arr({ AdvertisedTrainIdent: '999' })])).toEqual([]);
    expect(joinAnnouncements(route, '2026-11-25', [dep()], [arr({ AdvertisedTimeAtLocation: '2026-11-25T06:30:00.000+01:00' })])).toEqual([]);
  });

  test('skips departures on other days', () => {
    expect(
      joinAnnouncements(route, '2026-11-25', [dep({ AdvertisedTimeAtLocation: '2026-11-26T00:20:00.000+01:00', ScheduledDepartureDateTime: '2026-11-26T00:00:00.000+01:00' })], [arr()]),
    ).toEqual([]);
  });

  test('joins a late train that arrives after midnight', () => {
    const runs = joinAnnouncements(route, '2026-11-25', [dep({ AdvertisedTimeAtLocation: '2026-11-25T23:50:00.000+01:00' })], [
      arr({ AdvertisedTimeAtLocation: '2026-11-26T00:28:00.000+01:00' }),
    ]);
    expect(runs).toHaveLength(1);
  });
});

describe('TrafikverketAdapter', () => {
  test('posts one request and joins its two results', async () => {
    const calls: { url: string; body: string }[] = [];
    const fakeFetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), body: String(init.body) });
      return new Response(JSON.stringify({ RESPONSE: { RESULT: [{ TrainAnnouncement: [dep()] }, { TrainAnnouncement: [arr()] }] } }), { status: 200 });
    }) as typeof fetch;

    const runs = await new TrafikverketAdapter('KEY', fakeFetch).fetchDepartures(route, '2026-11-25');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.trafikinfo.trafikverket.se/v2/data.json');
    expect(runs.map((r) => r.trainId)).toEqual(['10912']);
  });

  test('skips station pairs outside the Mälartåg network without calling the API', async () => {
    let called = false;
    const fakeFetch = (async () => {
      called = true;
      return new Response('{}');
    }) as unknown as typeof fetch;
    const runs = await new TrafikverketAdapter('KEY', fakeFetch).fetchDepartures({ ...route, toUic: '740000002' }, '2026-11-25');
    expect(runs).toEqual([]);
    expect(called).toBe(false);
  });

  test('returns nothing on an API error', async () => {
    const fakeFetch = (async () =>
      new Response(JSON.stringify({ RESPONSE: { RESULT: [{ ERROR: { MESSAGE: 'Invalid key' } }] } }), { status: 200 })) as unknown as typeof fetch;
    expect(await new TrafikverketAdapter('BAD', fakeFetch).fetchDepartures(route, '2026-11-25')).toEqual([]);
  });
});
