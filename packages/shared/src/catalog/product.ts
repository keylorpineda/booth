import { z } from 'zod';

import { minorUnitsSchema } from '../money';

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_STOCK = 1_000_000;

const productFields = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable(),
  /** Price in minor units of the store currency, tax included. */
  priceMinor: minorUnitsSchema,
  categoryId: z.string().min(1).nullable(),
  /** false = made to order: no stock is reserved. */
  trackStock: z.boolean(),
  stock: z.number().int().min(0).max(MAX_STOCK),
  isActive: z.boolean(),
});

export const createProductSchema = productFields.extend({
  description: productFields.shape.description.default(null),
  categoryId: productFields.shape.categoryId.default(null),
  trackStock: z.boolean().default(false),
  stock: productFields.shape.stock.default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = productFields.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const imageUrlsSchema = z.object({
  thumb: z.string(),
  medium: z.string(),
  large: z.string(),
});

export const productImageSchema = z.object({
  id: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  urls: imageUrlsSchema,
});

export type ProductImage = z.infer<typeof productImageSchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  priceMinor: z.number().int(),
  categoryId: z.string().nullable(),
  trackStock: z.boolean(),
  stock: z.number().int(),
  isActive: z.boolean(),
  position: z.number().int(),
  images: z.array(productImageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export const productListQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
