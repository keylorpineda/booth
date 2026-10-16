import { type Provider, type Type } from '@nestjs/common';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { loadConfig } from '../../src/config/app-config';

export interface TestAppOptions {
  /** Environment overrides for this app only (e.g. lower rate limits). */
  env?: Record<string, string>;
  /** Extra controllers mounted next to the real app (test fixtures). */
  controllers?: Type[];
  /** Provider overrides, e.g. a failing PrismaService. */
  overrides?: { provide: unknown; useValue: unknown }[];
}

/** Boots the real AppModule with the same HTTP setup as production (`configureApp`). */
export async function createTestApp(options: TestAppOptions = {}): Promise<NestExpressApplication> {
  const previousEnv = { ...process.env };
  Object.assign(process.env, options.env);

  try {
    let builder = Test.createTestingModule({
      imports: [AppModule],
      controllers: options.controllers ?? [],
    });
    for (const { provide, useValue } of options.overrides ?? []) {
      builder = builder.overrideProvider(provide as Provider).useValue(useValue);
    }

    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, loadConfig());
    await app.init();
    return app;
  } finally {
    process.env = previousEnv;
  }
}
