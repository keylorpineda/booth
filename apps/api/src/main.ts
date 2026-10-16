import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { ConfigValidationError, loadConfig } from './config/app-config';
import { loadEnvFile } from './config/load-env-file';

async function bootstrap(): Promise<void> {
  loadEnvFile();
  // Validate before Nest starts so a bad environment fails fast with a readable message.
  const config = loadConfig();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  configureApp(app, config);
  await app.listen(config.port);
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof ConfigValidationError ? error.message : error);
  process.exit(1);
});
