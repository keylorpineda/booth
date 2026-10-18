import { z } from 'zod';

import { storeRoleSchema } from './memberships/roles';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // No length rules on login: never reveal password policy details to a guesser.
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  isDemo: z.boolean(),
});

export const authStoreSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

export const sessionSchema = z.object({
  user: authUserSchema,
  store: authStoreSummarySchema.nullable(),
  role: storeRoleSchema.nullable().default('OWNER'),
});

export type Session = z.infer<typeof sessionSchema>;

/** Returned by register, login and refresh. The refresh token travels only in an httpOnly cookie. */
export const authResponseSchema = sessionSchema.extend({
  accessToken: z.string(),
  accessTokenExpiresIn: z.number().int().positive(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
