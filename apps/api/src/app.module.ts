import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { LoggingModule } from './common/logging/logging.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { StoresModule } from './stores/stores.module';
import { TenancyModule } from './tenancy/tenancy.module';

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    RateLimitModule,
    PrismaModule,
    MediaModule,
    AuthModule,
    TenancyModule,
    HealthModule,
    StoresModule,
    CatalogModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
