import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  type CreateProductInput,
  type Paginated,
  paginatedSchema,
  type Product,
  productSchema,
  type UpdateProductInput,
} from '@booth/shared';

import { ownerApi } from '../../auth/owner-api';

export interface ProductFilters {
  q: string;
  categoryId: string | null;
}

const pageSchema = paginatedSchema(productSchema);
type ProductPages = InfiniteData<Paginated<Product>, string | undefined>;

export const productKeys = {
  all: ['owner', 'products'] as const,
  list: (filters: ProductFilters) => ['owner', 'products', 'list', filters] as const,
};

function toQuery({ q, categoryId }: ProductFilters, cursor?: string): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (categoryId) params.set('categoryId', categoryId);
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Products in display order, 50 per page. */
export function useProducts(filters: ProductFilters) {
  return useInfiniteQuery({
    queryKey: productKeys.list(filters),
    queryFn: ({ pageParam, signal }) =>
      ownerApi(`/me/products${toQuery(filters, pageParam)}`, { schema: pageSchema, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}

/**
 * Saves a new display order for the loaded products (the unfiltered list, so they are the first
 * positions). Optimistic: the rows move at once and roll back if the API refuses.
 */
export function useReorderProducts(filters: ProductFilters) {
  const queryClient = useQueryClient();
  const key = productKeys.list(filters);

  return useMutation({
    mutationFn: (ordered: Product[]) =>
      ownerApi('/me/products/order', {
        method: 'PUT',
        body: { ids: ordered.map((product) => product.id) },
      }),
    onMutate: async (ordered) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProductPages>(key);
      if (previous) {
        // Keep the page structure: refill the loaded pages with the new order.
        let offset = 0;
        const pages = previous.pages.map((page) => {
          const data = ordered.slice(offset, offset + page.data.length);
          offset += page.data.length;
          return { ...page, data };
        });
        queryClient.setQueryData<ProductPages>(key, { ...previous, pages });
      }
      return { previous };
    },
    onError: (_error, _ordered, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...productKeys.all, 'detail', id],
    queryFn: ({ signal }) =>
      ownerApi(`/me/products/${encodeURIComponent(id ?? '')}`, { schema: productSchema, signal }),
    enabled: id !== undefined,
  });
}

/** Create, update and delete. Lists, categories (counts) and the setup checklist refresh. */
export function useProductMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: productKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['owner', 'categories'] });
  };

  const create = useMutation({
    mutationFn: (input: CreateProductInput) =>
      ownerApi('/me/products', { method: 'POST', body: input, schema: productSchema }),
    onSuccess,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: UpdateProductInput & { id: string }) =>
      ownerApi(`/me/products/${id}`, { method: 'PATCH', body: input, schema: productSchema }),
    onSuccess,
  });

  const remove = useMutation({
    mutationFn: (id: string) => ownerApi(`/me/products/${id}`, { method: 'DELETE' }),
    onSuccess,
  });

  return { create, update, remove };
}
