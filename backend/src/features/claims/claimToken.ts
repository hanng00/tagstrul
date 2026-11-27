import type { ClaimProviderId } from '../../domain/claims.ts';

const PROVIDERS: readonly ClaimProviderId[] = ['sj', 'malardalstrafik'];

/**
 * The claim token the web app carries between claim steps. It wraps the provider's
 * own session so later steps know which provider to call: `<provider>:<session>`.
 */
export function encodeClaimToken(provider: ClaimProviderId, session: string): string {
  return `${provider}:${session}`;
}

/**
 * Reads a claim token. Tokens without a known provider prefix were issued before
 * tokens carried one, and those are always SJ sessions.
 */
export function decodeClaimToken(token: string): { provider: ClaimProviderId; session: string } {
  const sep = token.indexOf(':');
  if (sep > 0) {
    const prefix = token.slice(0, sep) as ClaimProviderId;
    if (PROVIDERS.includes(prefix)) return { provider: prefix, session: token.slice(sep + 1) };
  }
  return { provider: 'sj', session: token };
}
