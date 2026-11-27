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

export function createTrainDataAdapter(): TrainDataPort {
  const provider = process.env.TRAIN_DATA_PROVIDER ?? 'sj';
  switch (provider) {
    case 'trafikverket':
      return new TrafikverketAdapter();
    case 'sj':
    default:
      return new SJTrafficInfoAdapter();
  }
}

const claimAdapters: Record<ClaimProviderId, () => ClaimPort> = {
  sj: () => new SJClaimAdapter(),
};

export function claimAdapterFor(provider: ClaimProviderId): ClaimPort {
  return claimAdapters[provider]();
}
