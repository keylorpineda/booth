import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { ConfigValidationError, loadConfig } from './config/app-config';
import { loadEnvFile } from './config/load-env-file';

async function bootstrap(): Promise<void> {
  loadEnvFile();
  // Validate before Nest starts so a bad environment fails fast with a readable message.
  const config = loadConfig();

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(config.port);
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof ConfigValidationError ? error.message : error);
  process.exit(1);
});
