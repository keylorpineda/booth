import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import {
  type Category,
  categorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';

const listSchema = z.array(categorySchema);

export const categoryKeys = { all: ['owner', 'categories'] as const };

export const useCategories = () =>
  useQuery({
    queryKey: categoryKeys.all,
    queryFn: ({ signal }) => ownerApi('/me/categories', { schema: listSchema, signal }),
  });

/** Category mutations; product lists and the storefront also show categories, so they refresh. */
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['owner', 'products'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      ownerApi('/me/categories', { method: 'POST', body: input, schema: categorySchema }),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: UpdateCategoryInput & { id: string }) =>
      ownerApi(`/me/categories/${id}`, { method: 'PATCH', body: input, schema: categorySchema }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi(`/me/categories/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  /** Optimistic: the list moves at once and rolls back if the API refuses. */
  const reorder = useMutation({
    mutationFn: (ordered: Category[]) =>
      ownerApi('/me/categories/order', {
        method: 'PUT',
        body: { ids: ordered.map((category) => category.id) },
        schema: listSchema,
      }),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: categoryKeys.all });
      const previous = queryClient.getQueryData<Category[]>(categoryKeys.all);
      queryClient.setQueryData(categoryKeys.all, ordered);
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      queryClient.setQueryData(categoryKeys.all, context?.previous);
    },
    onSuccess: (categories) => {
      queryClient.setQueryData(categoryKeys.all, categories);
    },
  });

  return { create, update, remove, reorder };
}
