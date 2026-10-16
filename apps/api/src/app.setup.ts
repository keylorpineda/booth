import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { type AppConfig } from './config/app-config';
import { setupSwagger } from './docs/swagger';

export const API_PREFIX = 'api';

/** HTTP-level setup shared by `main.ts` and the e2e tests, so tests exercise the real app. */
export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  // Behind the Vercel rewrite and Render: lets req.ip (and rate limiting) use X-Forwarded-For.
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: config.corsOrigins, credentials: true });
  // /health stays at the root for the Render health check.
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  setupSwagger(app);
  app.enableShutdownHooks();
}
