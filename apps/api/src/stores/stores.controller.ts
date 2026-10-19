import { Controller, Delete, Get, Patch, Post, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  type CreateStoreInput,
  createStoreSchema,
  type SlugAvailability,
  slugAvailabilityQuerySchema,
  type Store,
  type StoreImageKind,
  storeImageKindSchema,
  type UpdateStoreInput,
  updateStoreSchema,
} from '@booth/shared';

import { StoreBrandingService } from './store-branding.service';
import { StoresService } from './stores.service';
import { type AuthContext } from '../auth/auth-context';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiZodBody, ZodBody, ZodParam, ZodQuery } from '../common/validation/zod.decorators';
import { assertImageFile } from '../media/image-file';
import { ImageUpload } from '../media/image-upload.decorator';
import { CrossStore } from '../prisma/cross-store.decorator';

const imageKindParam = ApiParam({ name: 'kind', enum: storeImageKindSchema.options });

@ApiTags('store')
@ApiBearerAuth()
@Controller('me/store')
export class StoresController {
  constructor(
    private readonly stores: StoresService,
    private readonly branding: StoreBrandingService,
  ) {}

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
  @Roles('OWNER', 'STAFF', 'CATALOG_MANAGER')
  @ApiOperation({ summary: "The signed-in owner's store settings" })
  get(@CurrentStore() storeId: string): Promise<Store> {
    return this.stores.get(storeId);
  }

  @Patch()
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update store info and branding' })
  @ApiZodBody(updateStoreSchema)
  update(
    @CurrentStore() storeId: string,
    @ZodBody(updateStoreSchema) body: UpdateStoreInput,
  ): Promise<Store> {
    return this.branding.update(storeId, body);
  }

  @Get('slug-availability')
  @CrossStore()
  @ApiOperation({ summary: 'Check whether a store URL can be used' })
  slugAvailability(
    @ZodQuery(slugAvailabilityQuerySchema) query: { slug: string },
  ): Promise<SlugAvailability> {
    return this.stores.slugAvailability(query.slug);
  }

  @Post(':kind')
  @Roles('OWNER')
  @imageKindParam
  @ImageUpload()
  @ApiOperation({ summary: 'Upload the logo or cover image (replaces the current one)' })
  setImage(
    @CurrentStore() storeId: string,
    @ZodParam('kind', storeImageKindSchema) kind: StoreImageKind,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<Store> {
    return this.branding.setImage(storeId, kind, assertImageFile(file));
  }

  @Delete(':kind')
  @Roles('OWNER')
  @imageKindParam
  @ApiOperation({ summary: 'Remove the logo or cover image' })
  removeImage(
    @CurrentStore() storeId: string,
    @ZodParam('kind', storeImageKindSchema) kind: StoreImageKind,
  ): Promise<Store> {
    return this.branding.removeImage(storeId, kind);
  }
}
