import {
  type InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

import { type Paginated, paginatedSchema, type Product, productSchema } from '@booth/shared';

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
