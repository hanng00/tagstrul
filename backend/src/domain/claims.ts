import type { Operator } from './operator.ts';

/** Who processes a compensation claim. */
export type ClaimProviderId = 'sj' | 'malardalstrafik';

export const CLAIM_PROVIDER_NAMES: Record<ClaimProviderId, string> = {
  sj: 'SJ',
  malardalstrafik: 'Mälardalstrafik',
};

/**
 * Decides where a claim for a delayed train goes. Movingo holders claim with
 * Mälardalstrafik for Mälartåg trains and with SJ for SJ trains. Trains with an
 * unknown operator go to SJ, as all claims did before operators were tracked.
 */
export function claimProviderFor(operator: Operator | undefined): ClaimProviderId {
  return operator === 'malartag' ? 'malardalstrafik' : 'sj';
}
