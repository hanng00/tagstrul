import type { TrainDataPort, TrainDeparture, StationPair } from './TrainDataPort.ts';
import type { DepartureConnection, FilteredConnectionsResponse } from './sj-types.ts';

const SJ_API_BASE = 'https://prod-api.adp.sj.se/public/trafficinfo-api/v2/rest';
const SJ_API_KEY = '39296c1a13304493b44236e1bcb7f544';

function getDelayMinutes(conn: DepartureConnection): number {
  const current = new Date(conn.currentDateTime);
  const original = new Date(conn.originalDateTime);
  return Math.round((current.getTime() - original.getTime()) / 60000);
}

export class SJTrafficInfoAdapter implements TrainDataPort {
  async fetchDepartures(route: StationPair, date: string): Promise<TrainDeparture[]> {
    const url = new URL(`${SJ_API_BASE}/filtered-connections`);
    url.searchParams.set('departure', route.from);
    url.searchParams.set('arrival', route.to);
    url.searchParams.set('date', date);
    url.searchParams.set('allDay', 'true');
    url.searchParams.set('lang', 'sv-SE');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'ocp-apim-subscription-key': SJ_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`SJ API error: ${response.status} for ${route.from} -> ${route.to} on ${date}`);
      return [];
    }

    const data = (await response.json()) as FilteredConnectionsResponse;

    return data.departureConnections.map((conn) => ({
      trainId: conn.trainNumber,
      fromStation: route.from,
      toStation: route.to,
      date: conn.departureDate,
      scheduledDeparture: conn.originalDateTime.slice(11, 16),
      actualDeparture: conn.currentDateTime.slice(11, 16),
      delayMinutes: getDelayMinutes(conn),
      cancelled: conn.cancelled,
      source: 'sj',
      rawRef: JSON.stringify({
        trainNumber: conn.trainNumber,
        originalDateTime: conn.originalDateTime,
        currentDateTime: conn.currentDateTime,
        operator: conn.operator,
      }),
    }));
  }
}
