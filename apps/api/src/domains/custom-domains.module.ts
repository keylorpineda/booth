import { Module } from '@nestjs/common';

import { CustomDomainsController } from './custom-domains.controller';
import { CustomDomainsService } from './custom-domains.service';
import { DnsVerificationService } from './dns-verification.service';

@Module({
  controllers: [CustomDomainsController],
  providers: [DnsVerificationService, CustomDomainsService],
  exports: [CustomDomainsService, DnsVerificationService],
})
export class CustomDomainsModule {}
