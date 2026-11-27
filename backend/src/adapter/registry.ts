/**
 * Composition root: the one place that picks concrete adapters for each port.
 * Handlers ask here for an adapter, and the domain never imports an adapter.
 */
import type { TrainDataPort } from '../ports/TrainDataPort.ts';
import type { ClaimPort } from '../ports/ClaimPort.ts';
import type { ClaimProviderId } from '../domain/claims.ts';
import { SJTrafficInfoAdapter } from './SJTrafficInfoAdapter.ts';
import { TrafikverketAdapter } from './TrafikverketAdapter.ts';
import { SJClaimAdapter } from './SJClaimAdapter.ts';
import { MalardalstrafikClaimAdapter } from './MalardalstrafikClaimAdapter.ts';
import { CombinedTrainDataAdapter } from './CombinedTrainDataAdapter.ts';

/**
 * SJ's API covers SJ trains. With a Trafikverket key, Mälartåg trains are read from
 * Trafikverket as well, and take precedence because Trafikverket measures delay at arrival.
 */
export function createTrainDataAdapter(): TrainDataPort {
  const sj = new SJTrafficInfoAdapter();
  const trafikverketKey = process.env.TRAFIKVERKET_API_KEY;
  if (!trafikverketKey) return sj;

  return new CombinedTrainDataAdapter([
    { port: new TrafikverketAdapter(trafikverketKey), operators: ['malartag'] },
    { port: sj },
  ]);
}

const claimAdapters: Record<ClaimProviderId, () => ClaimPort> = {
  sj: () => new SJClaimAdapter(),
  malardalstrafik: () => new MalardalstrafikClaimAdapter(),
};

export function claimAdapterFor(provider: ClaimProviderId): ClaimPort {
  return claimAdapters[provider]();
}
