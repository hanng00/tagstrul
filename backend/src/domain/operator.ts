/**
 * Train operators we know how to handle. Every observed train is tagged with one,
 * because the operator decides which compensation rules apply and where a claim goes.
 */
export type Operator = 'sj' | 'malartag' | 'unknown';

/**
 * Maps the operator name a data source reports (for example SJ's `operator` field,
 * or Trafikverket's `Operator`/`ProductInformation`) to our own operator id.
 */
export function normalizeOperator(raw: string | undefined | null): Operator {
  const name = (raw ?? '').trim().toLowerCase();
  if (!name) return 'unknown';
  if (name.includes('mälartåg') || name.includes('malartag') || name.includes('mälardalstrafik')) return 'malartag';
  if (name === 'sj' || name.startsWith('sj ') || name.includes('sj ab')) return 'sj';
  return 'unknown';
}
