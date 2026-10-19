import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { LoggingModule } from './common/logging/logging.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { ConfigModule } from './config/config.module';
import { CustomDomainsModule } from './domains/custom-domains.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { SettingsModule } from './settings/settings.module';
import { StoresModule } from './stores/stores.module';
import { TenancyModule } from './tenancy/tenancy.module';

// Scheduled jobs are off in tests, which call the services directly.
const scheduler = process.env.NODE_ENV === 'test' ? [] : [ScheduleModule.forRoot()];

@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    RateLimitModule,
    ...scheduler,
    PrismaModule,
    MediaModule,
    AuthModule,
    TenancyModule,
    HealthModule,
    StoresModule,
    CatalogModule,
    SettingsModule,
    OrdersModule,
    PublicModule,
    ReceiptsModule,
    CustomDomainsModule,
    MembershipsModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}
