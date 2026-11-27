import type { TrainDataPort, TrainDeparture, StationPair } from '../ports/TrainDataPort.ts';
import { normalizeOperator, type Operator } from '../domain/operator.ts';
import { malartagStationByUic } from '../data/malartag-stations.ts';

const API_URL = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
const SCHEMA_VERSION = '1.9';

/** The subset of Trafikverket's TrainAnnouncement object we read. */
export interface TrainAnnouncement {
  ActivityType: 'Avgang' | 'Ankomst';
  AdvertisedTrainIdent: string;
  AdvertisedTimeAtLocation: string;
  EstimatedTimeAtLocation?: string;
  TimeAtLocation?: string;
  Canceled?: boolean;
  LocationSignature: string;
  ScheduledDepartureDateTime?: string;
  Operator?: string;
  InformationOwner?: string;
  ProductInformation?: { Code?: string; Description?: string }[];
  Deviation?: { Code?: string; Description?: string }[];
  ModifiedTime?: string;
}

interface ApiResponse {
  RESPONSE: { RESULT: { TrainAnnouncement?: TrainAnnouncement[]; ERROR?: { MESSAGE?: string } }[] };
}

const INCLUDE = [
  'ActivityType',
  'AdvertisedTrainIdent',
  'AdvertisedTimeAtLocation',
  'EstimatedTimeAtLocation',
  'TimeAtLocation',
  'Canceled',
  'LocationSignature',
  'ScheduledDepartureDateTime',
  'Operator',
  'InformationOwner',
  'ProductInformation',
  'Deviation',
  'ModifiedTime',
];

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function announcementQuery(activity: 'Avgang' | 'Ankomst', signature: string, date: string): string {
  const include = INCLUDE.map((f) => `<INCLUDE>${f}</INCLUDE>`).join('');
  // Trains running late in the evening can arrive after midnight, so look into the early hours.
  return (
    `<QUERY objecttype="TrainAnnouncement" schemaversion="${SCHEMA_VERSION}" orderby="AdvertisedTimeAtLocation">` +
    '<FILTER><AND>' +
    `<EQ name="ActivityType" value="${activity}" />` +
    `<EQ name="LocationSignature" value="${escapeXml(signature)}" />` +
    '<EQ name="Advertised" value="true" />' +
    `<GTE name="AdvertisedTimeAtLocation" value="${date}T00:00:00" />` +
    `<LT name="AdvertisedTimeAtLocation" value="${nextDay(date)}T04:00:00" />` +
    '</AND></FILTER>' +
    include +
    '</QUERY>'
  );
}

export function buildRequestBody(apiKey: string, fromSignature: string, toSignature: string, date: string): string {
  return (
    `<REQUEST><LOGIN authenticationkey="${escapeXml(apiKey)}" />` +
    announcementQuery('Avgang', fromSignature, date) +
    announcementQuery('Ankomst', toSignature, date) +
    '</REQUEST>'
  );
}

/** Local HH:MM from a Trafikverket timestamp such as "2026-11-25T07:08:00.000+01:00". */
function localTime(timestamp: string): string {
  return timestamp.slice(11, 16);
}

function minutesBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000);
}

/** Who ran the train: the product name ("Mälartåg") is the clearest signal, then the information owner. */
export function operatorOf(a: TrainAnnouncement): Operator {
  for (const raw of [...(a.ProductInformation ?? []).map((p) => p.Description), a.InformationOwner, a.Operator]) {
    const op = normalizeOperator(raw);
    if (op !== 'unknown') return op;
  }
  return 'unknown';
}

/** The service day of a train run, so departures and arrivals of the same run can be joined. */
function runKey(a: TrainAnnouncement): string {
  const day = (a.ScheduledDepartureDateTime ?? a.AdvertisedTimeAtLocation).slice(0, 10);
  return `${a.AdvertisedTrainIdent}_${day}`;
}

/**
 * Joins departures from the origin with arrivals at the destination into one record per train.
 *
 * Delay is measured at arrival, because that is what compensation is based on. A train counts
 * as cancelled when either end is cancelled. Only departures on `date` are kept.
 */
export function joinAnnouncements(
  route: StationPair,
  date: string,
  departures: TrainAnnouncement[],
  arrivals: TrainAnnouncement[],
): TrainDeparture[] {
  const arrivalsByRun = new Map(arrivals.map((a) => [runKey(a), a]));
  const result: TrainDeparture[] = [];

  for (const dep of departures) {
    if (dep.AdvertisedTimeAtLocation.slice(0, 10) !== date) continue;
    const arr = arrivalsByRun.get(runKey(dep));
    if (!arr || arr.AdvertisedTimeAtLocation <= dep.AdvertisedTimeAtLocation) continue;

    const arrivalActual = arr.TimeAtLocation ?? arr.EstimatedTimeAtLocation;
    const delayMinutes = arrivalActual ? Math.max(0, minutesBetween(arr.AdvertisedTimeAtLocation, arrivalActual)) : 0;
    const departureActual = dep.TimeAtLocation ?? dep.EstimatedTimeAtLocation;
    const deviation = [...(arr.Deviation ?? []), ...(dep.Deviation ?? [])].map((d) => d.Description).find(Boolean);

    result.push({
      trainId: dep.AdvertisedTrainIdent,
      fromStation: route.from,
      toStation: route.to,
      date,
      scheduledDeparture: localTime(dep.AdvertisedTimeAtLocation),
      actualDeparture: departureActual ? localTime(departureActual) : undefined,
      delayMinutes,
      cancelled: Boolean(dep.Canceled || arr.Canceled),
      source: 'trafikverket',
      operator: operatorOf(dep),
      rawRef: JSON.stringify({
        trainIdent: dep.AdvertisedTrainIdent,
        advertisedDeparture: dep.AdvertisedTimeAtLocation,
        advertisedArrival: arr.AdvertisedTimeAtLocation,
        arrival: arrivalActual,
        operator: dep.Operator,
        informationOwner: dep.InformationOwner,
      }),
      disruptionReason: deviation,
    });
  }

  return result;
}

/**
 * Reads train runs from Trafikverket's open API (TrainAnnouncement), which covers every
 * operator. Station pairs outside the Mälartåg network are skipped, because we only know
 * Trafikverket's station signatures for that network.
 */
export class TrafikverketAdapter implements TrainDataPort {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]> {
    const from = malartagStationByUic(route.fromUic);
    const to = malartagStationByUic(route.toUic);
    if (!from || !to) return [];

    const response = await this.fetchImpl(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'text/xml' },
      body: buildRequestBody(this.apiKey, from.signature, to.signature, date),
    });

    if (!response.ok) {
      console.error(`[TrafikverketAdapter] Error ${response.status} for ${route.from} -> ${route.to} on ${date}: ${await response.text()}`);
      return [];
    }

    const data = (await response.json()) as ApiResponse;
    const [depResult, arrResult] = data.RESPONSE?.RESULT ?? [];
    const error = depResult?.ERROR ?? arrResult?.ERROR;
    if (error) {
      console.error(`[TrafikverketAdapter] API error for ${route.from} -> ${route.to}: ${error.MESSAGE}`);
      return [];
    }

    const runs = joinAnnouncements(route, date, depResult?.TrainAnnouncement ?? [], arrResult?.TrainAnnouncement ?? []);
    console.log(`[TrafikverketAdapter] Got ${runs.length} runs for ${route.from} -> ${route.to}`);
    return runs;
  }
}
