import { z } from 'zod';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@booth/shared';

/** Form-shaped auth schemas: same rules as the API's, with i18n keys as messages. */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'validation.required')
  .pipe(z.email('validation.email').max(254, 'validation.tooLong'));

export const loginFormSchema = z.object({
  email,
  password: z.string().min(1, 'validation.required').max(PASSWORD_MAX_LENGTH, 'validation.tooLong'),
});

export type LoginForm = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(80, 'validation.tooLong'),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, 'validation.passwordLength')
    .max(PASSWORD_MAX_LENGTH, 'validation.tooLong'),
});

export type RegisterForm = z.infer<typeof registerFormSchema>;

/**
 * Where to go after signing in. Only same-origin paths are honored: `//evil.com` or
 * `https://...` would turn the login page into an open redirect.
 */
export function safeRedirect(target: string | null, fallback = '/dashboard'): string {
  if (!target?.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback;
  }
  return target;
}
