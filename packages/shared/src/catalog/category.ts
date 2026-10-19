import { z } from 'zod';

const categoryFields = z.object({
  name: z.string().trim().min(1).max(60),
  isActive: z.boolean(),
});

export const createCategorySchema = categoryFields.extend({
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = categoryFields.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().int(),
  isActive: z.boolean(),
  productCount: z.number().int(),
});

export type Category = z.infer<typeof categorySchema>;
