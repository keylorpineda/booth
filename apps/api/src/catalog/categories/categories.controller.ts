import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type Category,
  type CreateCategoryInput,
  createCategorySchema,
  type ReorderInput,
  reorderSchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from '@booth/shared';

import { CategoriesService } from './categories.service';
import { CurrentStore } from '../../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody } from '../../common/validation/zod.decorators';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('me/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Categories in display order, with product counts' })
  list(@CurrentStore() storeId: string): Promise<Category[]> {
    return this.categories.list(storeId);
  }

  @Post()
  @ApiZodBody(createCategorySchema)
  create(
    @CurrentStore() storeId: string,
    @ZodBody(createCategorySchema) body: CreateCategoryInput,
  ): Promise<Category> {
    return this.categories.create(storeId, body);
  }

  @Put('order')
  @ApiOperation({ summary: 'Set the display order: ids in the new order' })
  @ApiZodBody(reorderSchema)
  reorder(
    @CurrentStore() storeId: string,
    @ZodBody(reorderSchema) body: ReorderInput,
  ): Promise<Category[]> {
    return this.categories.reorder(storeId, body.ids);
  }

  @Patch(':id')
  @ApiZodBody(updateCategorySchema)
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updateCategorySchema) body: UpdateCategoryInput,
  ): Promise<Category> {
    return this.categories.update(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category; its products become uncategorized' })
  remove(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    return this.categories.remove(storeId, id);
  }
}
