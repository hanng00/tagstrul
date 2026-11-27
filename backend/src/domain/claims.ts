import type { Operator } from './operator.ts';

/** Who processes a compensation claim. */
export type ClaimProviderId = 'sj';

/**
 * Decides where a claim for a delayed train goes.
 *
 * Movingo holders claim with SJ for SJ trains and with Mälardalstrafik for Mälartåg
 * trains. Only SJ is supported so far, so every claim goes to SJ, as it always has.
 */
export function claimProviderFor(_operator: Operator | undefined): ClaimProviderId {
  return 'sj';
}
