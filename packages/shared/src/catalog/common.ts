import { z } from 'zod';

/** New order for a list of the store's own items: ids in display order, no duplicates. */
export const reorderSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate ids'),
});

export type ReorderInput = z.infer<typeof reorderSchema>;

/** Cursor pagination envelope: `{ data, nextCursor }`. */
export const paginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
  });

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
}
