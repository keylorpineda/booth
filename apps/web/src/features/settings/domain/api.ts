import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { type CreateCustomDomainInput, type CustomDomain } from '@booth/shared';

import { api } from '../../../lib/api-client';

export const domainKeys = {
  customDomain: ['settings', 'custom-domain'] as const,
};

export function useCustomDomainQuery() {
  return useQuery({
    queryKey: domainKeys.customDomain,
    queryFn: ({ signal }) => api<CustomDomain | null>('/me/custom-domain', { signal }),
  });
}

export function useCreateCustomDomainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomDomainInput) =>
      api<CustomDomain>('/me/custom-domain', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.customDomain });
    },
  });
}

export function useVerifyCustomDomainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<CustomDomain>('/me/custom-domain/verify', {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.customDomain });
    },
  });
}

export function useRemoveCustomDomainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api('/me/custom-domain', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: domainKeys.customDomain });
    },
  });
}
