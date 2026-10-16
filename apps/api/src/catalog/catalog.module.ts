import { Module } from '@nestjs/common';

import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { ProductImagesService } from './products/product-images.service';
import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';

@Module({
  controllers: [CategoriesController, ProductsController],
  providers: [CategoriesService, ProductsService, ProductImagesService],
})
export class CatalogModule {}
