import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  type CreateInvitationInput,
  type StoreInvitation,
  type StoreMembership,
  type StoreRole,
} from '@booth/shared';

import { api } from '../../../lib/api-client';

export const teamKeys = {
  members: ['settings', 'team', 'members'] as const,
  invitations: ['settings', 'team', 'invitations'] as const,
};

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: teamKeys.members,
    queryFn: ({ signal }) => api<StoreMembership[]>('/me/team/members', { signal }),
  });
}

export function useTeamInvitationsQuery() {
  return useQuery({
    queryKey: teamKeys.invitations,
    queryFn: ({ signal }) => api<StoreInvitation[]>('/me/team/invitations', { signal }),
  });
}

export function useCreateInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInvitationInput) =>
      api<StoreInvitation>('/me/team/invitations', {
        method: 'POST',
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.invitations });
    },
  });
}

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      api(`/me/team/invitations/${invitationId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.invitations });
    },
  });
}

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: StoreRole }) =>
      api<StoreMembership>(`/me/team/members/${memberId}`, {
        method: 'PATCH',
        body: { role },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.members });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api(`/me/team/members/${memberId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.members });
    },
  });
}
