import { Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type CreateCustomDomainInput,
  createCustomDomainInputSchema,
  type CustomDomain,
} from '@booth/shared';

import { CustomDomainsService } from './custom-domains.service';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('settings')
@ApiBearerAuth()
@Roles('OWNER')
@Controller('me/custom-domain')
export class CustomDomainsController {
  constructor(private readonly customDomains: CustomDomainsService) {}

  @Get()
  @ApiOperation({ summary: 'Get custom domain configuration for current store' })
  get(@CurrentStore() storeId: string): Promise<CustomDomain | null> {
    return this.customDomains.get(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Connect a custom domain and get DNS TXT verification token' })
  @ApiZodBody(createCustomDomainInputSchema)
  create(
    @CurrentStore() storeId: string,
    @ZodBody(createCustomDomainInputSchema) body: CreateCustomDomainInput,
  ): Promise<CustomDomain> {
    return this.customDomains.create(storeId, body);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify DNS TXT records for the custom domain' })
  verify(@CurrentStore() storeId: string): Promise<CustomDomain> {
    return this.customDomains.verify(storeId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect custom domain' })
  remove(@CurrentStore() storeId: string): Promise<void> {
    return this.customDomains.remove(storeId);
  }
}
