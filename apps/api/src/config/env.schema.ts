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

/** Empty strings (as in `KEY=` lines of .env files) count as unset. */
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    TRUST_PROXY: trustProxy.default(false),
    CORS_ORIGINS: csv,
    WEB_PUBLIC_URL: z.url(),
    DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, 'Must be a PostgreSQL connection URL'),
    JWT_ACCESS_SECRET: z.string().min(32, 'Use at least 32 random characters'),
    JWT_ACCESS_TTL_MINUTES: positiveInt.default(15),
    REFRESH_TOKEN_TTL_DAYS: positiveInt.default(30),
    RATE_LIMIT_TTL_SECONDS: positiveInt.default(60),
    RATE_LIMIT_DEFAULT: positiveInt.default(120),
    RATE_LIMIT_AUTH: positiveInt.default(10),
    RATE_LIMIT_PUBLIC_ORDERS: positiveInt.default(20),
    // Optional in development (uploads answer 503 MEDIA_NOT_CONFIGURED), required in production.
    /** Lifetime of the signed URLs owners use to view payment receipts. */
    RECEIPT_URL_TTL_SECONDS: positiveInt.max(3600).default(300),
    /** Enables POST /api/internal/jobs/expire-orders for an external cron. */
    JOB_SECRET: optionalString.pipe(z.string().min(32).optional()),
    CLOUDINARY_CLOUD_NAME: optionalString,
    CLOUDINARY_API_KEY: optionalString,
    CLOUDINARY_API_SECRET: optionalString,
    /** Google Gemini API key for smart receipt verification. Optional; fallback to manual when null. */
    GEMINI_API_KEY: optionalString,
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.JWT_ACCESS_SECRET.startsWith('change-me')) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_ACCESS_SECRET'],
        message: 'Replace the example value with a random secret',
      });
    }
    const cloudinary = [
      env.CLOUDINARY_CLOUD_NAME,
      env.CLOUDINARY_API_KEY,
      env.CLOUDINARY_API_SECRET,
    ];
    const configured = cloudinary.filter(Boolean).length;
    if (configured > 0 && configured < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['CLOUDINARY_CLOUD_NAME'],
        message: 'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET together',
      });
    }
    if (env.NODE_ENV === 'production' && configured === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['CLOUDINARY_CLOUD_NAME'],
        message: 'Cloudinary credentials are required in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;
