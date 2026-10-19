import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaService } from './prisma.service';
import { StoreScopeInterceptor } from './store-scope.interceptor';

@Global()
@Module({
  providers: [PrismaService, { provide: APP_INTERCEPTOR, useClass: StoreScopeInterceptor }],
  exports: [PrismaService],
})
export class PrismaModule {}
