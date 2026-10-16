import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from './auth';

describe('registerSchema', () => {
  it('normalizes the email and trims the name', () => {
    expect(
      registerSchema.parse({ name: '  Ana  ', email: ' Ana@Example.COM ', password: 'secret123' }),
    ).toEqual({ name: 'Ana', email: 'ana@example.com', password: 'secret123' });
  });

  it('requires a password of at least 8 characters', () => {
    const result = registerSchema.safeParse({ name: 'Ana', email: 'a@b.co', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid emails', () => {
    const result = registerSchema.safeParse({ name: 'Ana', email: 'nope', password: 'secret123' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
});
