import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import {
  type CreateOrderInput,
  orderCreatedSchema,
  type QuoteRequest,
  quoteSchema,
} from '@booth/shared';

import { api } from '../../lib/api-client';

const storePath = (slug: string) => `/public/stores/${encodeURIComponent(slug)}`;

/** Server-computed totals for the current cart; keeps the last numbers while refetching. */
export function useQuoteQuery(slug: string, request: QuoteRequest | null) {
  return useQuery({
    queryKey: ['storefront', slug, 'quote', request],
    queryFn: ({ signal }) =>
      api(`${storePath(slug)}/quote`, {
        method: 'POST',
        body: request,
        schema: quoteSchema,
        signal,
      }),
    enabled: request !== null && request.items.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function usePlaceOrderMutation(slug: string) {
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      api(`${storePath(slug)}/orders`, { method: 'POST', body: input, schema: orderCreatedSchema }),
  });
}
