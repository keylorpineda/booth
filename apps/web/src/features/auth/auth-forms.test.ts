import { describe, expect, it } from 'vitest';

import { registerFormSchema, safeRedirect } from './auth-forms';

describe('safeRedirect', () => {
  it('keeps same-origin paths', () => {
    expect(safeRedirect('/dashboard/orders?status=PENDING')).toBe(
      '/dashboard/orders?status=PENDING',
    );
  });

  it.each([null, '', 'https://evil.com', '//evil.com', '/\\evil.com', 'javascript:alert(1)'])(
    'falls back for %s',
    (target) => {
      expect(safeRedirect(target)).toBe('/dashboard');
    },
  );
});

describe('registerFormSchema', () => {
  it('normalizes the email and enforces the password length', () => {
    const result = registerFormSchema.safeParse({
      name: 'Ana',
      email: '  Ana@Example.COM ',
      password: 'short',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'validation.passwordLength',
    ]);

    const ok = registerFormSchema.parse({
      name: 'Ana',
      email: 'Ana@Example.COM',
      password: 'long enough',
    });
    expect(ok.email).toBe('ana@example.com');
  });
});
