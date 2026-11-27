import { describe, expect, test } from 'bun:test';
import { cognitoGroups, isAdmin } from './auth.ts';

const withGroups = (groups: unknown) => ({ requestContext: { authorizer: { claims: { 'cognito:groups': groups } } } });

describe('cognitoGroups', () => {
  test('returns empty list when claim is missing', () => {
    expect(cognitoGroups({})).toEqual([]);
    expect(cognitoGroups({ requestContext: { authorizer: { claims: {} } } })).toEqual([]);
    expect(cognitoGroups({ requestContext: { authorizer: null } })).toEqual([]);
  });

  test('parses single, comma separated and bracketed strings', () => {
    expect(cognitoGroups(withGroups('admin'))).toEqual(['admin']);
    expect(cognitoGroups(withGroups('admin,beta'))).toEqual(['admin', 'beta']);
    expect(cognitoGroups(withGroups('[admin, beta]'))).toEqual(['admin', 'beta']);
  });

  test('accepts arrays', () => {
    expect(cognitoGroups(withGroups(['beta', 'admin']))).toEqual(['beta', 'admin']);
  });
});

describe('isAdmin', () => {
  test('true only for members of the admin group', () => {
    expect(isAdmin(withGroups('admin'))).toBe(true);
    expect(isAdmin(withGroups('[beta, admin]'))).toBe(true);
    expect(isAdmin(withGroups('administrators'))).toBe(false);
    expect(isAdmin(withGroups('beta'))).toBe(false);
    expect(isAdmin({})).toBe(false);
  });
});
