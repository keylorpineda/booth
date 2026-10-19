import { useMutation, useQuery } from '@tanstack/react-query';

import { type CreateStoreInput, slugAvailabilitySchema, storeSchema } from '@booth/shared';

import { ownerApi } from '../auth/owner-api';
import { useSessionStore } from '../auth/session-store';

/** Live slug check. Only asked for slugs that already pass the local rules. */
export function useSlugAvailability(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ['owner', 'slug-availability', slug],
    queryFn: ({ signal }) =>
      ownerApi(`/me/store/slug-availability?slug=${encodeURIComponent(slug)}`, {
        schema: slugAvailabilitySchema,
        signal,
      }),
    enabled,
    staleTime: 10_000,
    retry: false,
  });
}

export function useCreateStoreMutation() {
  return useMutation({
    mutationFn: (input: CreateStoreInput) =>
      ownerApi('/me/store', { method: 'POST', body: input, schema: storeSchema }),
    onSuccess: ({ id, slug, name }) => {
      const { session, setSession } = useSessionStore.getState();
      if (session) setSession({ ...session, store: { id, slug, name } });
    },
  });
}
