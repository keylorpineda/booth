import { z } from 'zod';

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()));

/**
 * Express "trust proxy": a hop count ("1"), "true"/"false", or a subnet list ("loopback, 10.0.0.0/8").
 * Production sits behind the Vercel rewrite and Render's load balancer.
 */
const trustProxy = z.string().transform((value): boolean | number | string => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return /^\d+$/.test(value) ? Number(value) : value;
});

const positiveInt = z.coerce.number().int().positive();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: trustProxy.default(false),
  CORS_ORIGINS: csv,
  WEB_PUBLIC_URL: z.url(),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'Must be a PostgreSQL connection URL'),
  RATE_LIMIT_TTL_SECONDS: positiveInt.default(60),
  RATE_LIMIT_DEFAULT: positiveInt.default(120),
  RATE_LIMIT_AUTH: positiveInt.default(10),
  RATE_LIMIT_PUBLIC_ORDERS: positiveInt.default(20),
});

export type Env = z.infer<typeof envSchema>;
