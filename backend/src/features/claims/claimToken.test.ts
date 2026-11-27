import { describe, expect, test } from 'bun:test';
import { encodeClaimToken, decodeClaimToken } from './claimToken.ts';

describe('claim token', () => {
  test('round-trips provider and session', () => {
    expect(decodeClaimToken(encodeClaimToken('sj', 'abc123'))).toEqual({ provider: 'sj', session: 'abc123' });
  });

  test('keeps colons inside the session', () => {
    expect(decodeClaimToken('sj:a:b:c')).toEqual({ provider: 'sj', session: 'a:b:c' });
  });

  test('treats tokens without a known prefix as legacy SJ sessions', () => {
    expect(decodeClaimToken('eyJhbGciOi.xyz')).toEqual({ provider: 'sj', session: 'eyJhbGciOi.xyz' });
    expect(decodeClaimToken('other:xyz')).toEqual({ provider: 'sj', session: 'other:xyz' });
  });
});
