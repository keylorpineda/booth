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
  UploadedFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type CreateProductInput,
  createProductSchema,
  type Paginated,
  type Product,
  type ProductImage,
  type ProductListQuery,
  productListQuerySchema,
  type ReorderInput,
  reorderSchema,
  type UpdateProductInput,
  updateProductSchema,
} from '@booth/shared';

import { ProductImagesService } from './product-images.service';
import { ProductsService } from './products.service';
import { CurrentStore } from '../../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody, ZodQuery } from '../../common/validation/zod.decorators';
import { assertImageFile } from '../../media/image-file';
import { ImageUpload } from '../../media/image-upload.decorator';

@ApiTags('catalog')
@ApiBearerAuth()
@Controller('me/products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly images: ProductImagesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Products in display order (cursor pagination, filters)' })
  list(
    @CurrentStore() storeId: string,
    @ZodQuery(productListQuerySchema) query: ProductListQuery,
  ): Promise<Paginated<Product>> {
    return this.products.list(storeId, query);
  }

  @Post()
  @ApiZodBody(createProductSchema)
  create(
    @CurrentStore() storeId: string,
    @ZodBody(createProductSchema) body: CreateProductInput,
  ): Promise<Product> {
    return this.products.create(storeId, body);
  }

  @Put('order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiZodBody(reorderSchema)
  reorder(
    @CurrentStore() storeId: string,
    @ZodBody(reorderSchema) body: ReorderInput,
  ): Promise<void> {
    return this.products.reorder(storeId, body.ids);
  }

  @Get(':id')
  get(@CurrentStore() storeId: string, @Param('id') id: string): Promise<Product> {
    return this.products.get(storeId, id);
  }

  @Patch(':id')
  @ApiZodBody(updateProductSchema)
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updateProductSchema) body: UpdateProductInput,
  ): Promise<Product> {
    return this.products.update(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    return this.products.remove(storeId, id);
  }

  @Post(':id/images')
  @ImageUpload()
  @ApiOperation({ summary: 'Upload a product image (JPEG, PNG, WebP or AVIF, max 5 MB)' })
  addImage(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ProductImage> {
    return this.images.add(storeId, id, assertImageFile(file));
  }

  @Put(':id/images/order')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiZodBody(reorderSchema)
  reorderImages(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(reorderSchema) body: ReorderInput,
  ): Promise<void> {
    return this.images.reorder(storeId, id, body.ids);
  }

  @Delete(':id/images/:imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.images.remove(storeId, id, imageId);
  }
}
