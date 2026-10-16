import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type CreateStoreInput,
  createStoreSchema,
  type SlugAvailability,
  slugAvailabilityQuerySchema,
  type Store,
} from '@booth/shared';

import { StoresService } from './stores.service';
import { type AuthContext } from '../auth/auth-context';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiZodBody, ZodBody, ZodQuery } from '../common/validation/zod.decorators';

@ApiTags('store')
@ApiBearerAuth()
@Controller('me/store')
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Onboarding: create the store for the signed-in owner' })
  @ApiZodBody(createStoreSchema)
  create(
    @CurrentUser() user: AuthContext,
    @ZodBody(createStoreSchema) body: CreateStoreInput,
  ): Promise<Store> {
    return this.stores.create(user.userId, body);
  }

  @Get()
  @ApiOperation({ summary: "The signed-in owner's store settings" })
  get(@CurrentStore() storeId: string): Promise<Store> {
    return this.stores.get(storeId);
  }

  @Get('slug-availability')
  @ApiOperation({ summary: 'Check whether a store URL can be used' })
  slugAvailability(
    @ZodQuery(slugAvailabilityQuerySchema) query: { slug: string },
  ): Promise<SlugAvailability> {
    return this.stores.slugAvailability(query.slug);
  }
}
