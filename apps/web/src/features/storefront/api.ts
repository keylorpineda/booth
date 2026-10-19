import { useQuery } from '@tanstack/react-query';

import { type PublicCatalog, type PublicStore } from '@booth/shared';

import { api } from '../../lib/api-client';
import { takePrefetched } from '../../lib/prefetch';

export const storefrontKeys = {
  store: (slug: string) => ['storefront', slug, 'store'] as const,
  catalog: (slug: string) => ['storefront', slug, 'catalog'] as const,
};

const storePath = (slug: string) =>
  slug ? `/public/stores/${encodeURIComponent(slug)}` : '/public/storefront';

/*
 * First-load storefront data: typed, not validated at runtime (see api-client), and the first
 * request reuses the one started in index.html. Refetches go to the API as usual.
 */
export function useStoreQuery(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.store(slug),
    queryFn: async ({ signal }) =>
      (await takePrefetched<PublicStore>('store', slug)) ??
      api<PublicStore>(storePath(slug), { signal }),
  });
}

export function useCatalogQuery(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.catalog(slug),
    queryFn: async ({ signal }) =>
      (await takePrefetched<PublicCatalog>('catalog', slug)) ??
      api<PublicCatalog>(`${storePath(slug)}/catalog`, { signal }),
  });
}
