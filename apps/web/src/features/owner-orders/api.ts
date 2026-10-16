import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { ownerOrderSchema, ownerOrderSummarySchema, paginatedSchema } from '@booth/shared';

import { type OrderFilters, toApiQuery } from './order-filters';
import { ownerApi } from '../auth/owner-api';

const pageSchema = paginatedSchema(ownerOrderSummarySchema);

/** Polling interval while the list is open, so new orders show up without a reload. */
export const ORDERS_REFRESH_MS = 30_000;

export const orderKeys = {
  all: ['owner', 'orders'] as const,
  list: (filters: OrderFilters) => ['owner', 'orders', 'list', filters] as const,
  detail: (id: string) => ['owner', 'orders', 'detail', id] as const,
};

/** Newest first, one page per "load more". Each request also runs lazy expiry on the API. */
export function useOwnerOrders(filters: OrderFilters) {
  return useInfiniteQuery({
    queryKey: orderKeys.list(filters),
    queryFn: ({ pageParam, signal }) => {
      const query = toApiQuery(filters, pageParam);
      return ownerApi(`/me/orders${query ? `?${query}` : ''}`, { schema: pageSchema, signal });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    refetchInterval: ORDERS_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

/** One order with lines, delivery details and timeline (404 for other stores' orders). */
export function useOwnerOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) =>
      ownerApi(`/me/orders/${encodeURIComponent(id)}`, { schema: ownerOrderSchema, signal }),
    refetchInterval: ORDERS_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}
