import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { type AppConfig } from './config/app-config';
import { setupSwagger } from './docs/swagger';

export const API_PREFIX = 'api';
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=()';

/** HTTP-level setup shared by `main.ts` and the e2e tests, so tests exercise the real app. */
export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  // Behind the Vercel rewrite and Render: lets req.ip (and rate limiting) use X-Forwarded-For.
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'none'"],
        },
      },
    }),
  );
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Permissions-Policy', PERMISSIONS_POLICY);
    next();
  });
  app.use(cookieParser());
  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }
      if (config.corsOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }
      try {
        const parsed = new URL(requestOrigin);
        if (parsed.hostname.endsWith('.localhost') || parsed.hostname === 'localhost') {
          callback(null, true);
          return;
        }
        if (parsed.hostname.endsWith('.booth.app') || parsed.hostname === 'booth.app') {
          callback(null, true);
          return;
        }
      } catch {
        // Ignore invalid URL parsing from origin header
      }
      if (config.env !== 'production') {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  // /health stays at the root for the Render health check.
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  setupSwagger(app);
  app.enableShutdownHooks();
}
