import { type Env, envSchema } from './env.schema';

export interface AppConfig {
  env: Env['NODE_ENV'];
  isProduction: boolean;
  port: number;
  logLevel: Env['LOG_LEVEL'];
  trustProxy: boolean | number | string;
  corsOrigins: string[];
  webPublicUrl: string;
  databaseUrl: string;
  auth: {
    accessSecret: string;
    accessTtlSeconds: number;
    refreshTtlDays: number;
  };
  /** null disables the internal jobs endpoint. */
  jobSecret: string | null;
  /** null when uploads are not configured (development only). */
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string } | null;
  rateLimit: {
    ttlMs: number;
    default: number;
    auth: number;
    publicOrders: number;
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');

export class ConfigValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
    this.name = 'ConfigValidationError';
  }
}

/** Validates environment variables and maps them to a typed config. Throws a readable error. */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new ConfigValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }

  const env = result.data;
  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    port: env.PORT,
    logLevel: env.LOG_LEVEL,
    trustProxy: env.TRUST_PROXY,
    corsOrigins: env.CORS_ORIGINS,
    webPublicUrl: env.WEB_PUBLIC_URL,
    databaseUrl: env.DATABASE_URL,
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessTtlSeconds: env.JWT_ACCESS_TTL_MINUTES * 60,
      refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    },
    jobSecret: env.JOB_SECRET ?? null,
    cloudinary:
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
        ? {
            cloudName: env.CLOUDINARY_CLOUD_NAME,
            apiKey: env.CLOUDINARY_API_KEY,
            apiSecret: env.CLOUDINARY_API_SECRET,
          }
        : null,
    rateLimit: {
      ttlMs: env.RATE_LIMIT_TTL_SECONDS * 1000,
      default: env.RATE_LIMIT_DEFAULT,
      auth: env.RATE_LIMIT_AUTH,
      publicOrders: env.RATE_LIMIT_PUBLIC_ORDERS,
    },
  };
}
