import { describe, expect, it } from 'vitest';

import {
  acceptInvitationInputSchema,
  createInvitationInputSchema,
  storeRoleSchema,
} from './membership';

describe('memberships schemas', () => {
  it('validates store roles', () => {
    expect(storeRoleSchema.parse('OWNER')).toBe('OWNER');
    expect(storeRoleSchema.parse('STAFF')).toBe('STAFF');
    expect(storeRoleSchema.parse('CATALOG_MANAGER')).toBe('CATALOG_MANAGER');
    expect(() => storeRoleSchema.parse('SUPERADMIN')).toThrow();
  });

  it('validates create invitation input and normalizes email', () => {
    const parsed = createInvitationInputSchema.parse({
      email: ' Helper@Example.com ',
      role: 'STAFF',
    });
    expect(parsed.email).toBe('helper@example.com');
    expect(parsed.role).toBe('STAFF');

    expect(() =>
      createInvitationInputSchema.parse({
        email: 'bad-email',
        role: 'STAFF',
      }),
    ).toThrow();

    // Owner role cannot be invited directly
    expect(() =>
      createInvitationInputSchema.parse({
        email: 'helper@example.com',
        role: 'OWNER',
      }),
    ).toThrow();
  });

  it('validates accept invitation input with name and password', () => {
    const parsed = acceptInvitationInputSchema.parse({
      name: '  Carlos Rojas  ',
      password: 'password123',
    });
    expect(parsed.name).toBe('Carlos Rojas');

    expect(() =>
      acceptInvitationInputSchema.parse({
        name: '',
        password: 'short',
      }),
    ).toThrow();
  });
});
