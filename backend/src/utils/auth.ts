export const ADMIN_GROUP = 'admin';

type ClaimsEvent = {
  requestContext?: { authorizer?: { claims?: Record<string, unknown> } | null };
};

/**
 * Returns the Cognito groups on the caller's token.
 *
 * API Gateway REST authorizers pass `cognito:groups` as a string, either a single
 * name, a comma separated list, or a bracketed list like "[admin, beta]".
 * Arrays are accepted too so the helper works with other integrations.
 */
export function cognitoGroups(event: ClaimsEvent): string[] {
  const raw = event.requestContext?.authorizer?.claims?.['cognito:groups'];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw !== 'string') return [];
  return raw
    .replace(/^\[|\]$/g, '')
    .split(/[\s,]+/)
    .filter(Boolean);
}

export function isAdmin(event: ClaimsEvent): boolean {
  return cognitoGroups(event).includes(ADMIN_GROUP);
}
