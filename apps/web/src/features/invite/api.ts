import { useMutation, useQuery } from '@tanstack/react-query';

import {
  type AcceptInvitationInput,
  type AuthResponse,
  type PublicInvitationInfo,
} from '@booth/shared';

import { api } from '../../lib/api-client';

export function usePublicInvitationQuery(token: string) {
  return useQuery({
    queryKey: ['public', 'invitations', token],
    queryFn: ({ signal }) => api<PublicInvitationInfo>(`/public/invitations/${token}`, { signal }),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useAcceptInvitationMutation(token: string) {
  return useMutation({
    mutationFn: (body: AcceptInvitationInput) =>
      api<AuthResponse>(`/public/invitations/${token}/accept`, {
        method: 'POST',
        body,
      }),
  });
}
