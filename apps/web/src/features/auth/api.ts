import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type AuthResponse,
  authResponseSchema,
  type LoginInput,
  type RegisterInput,
} from '@booth/shared';

import { endSession } from './session';
import { useSessionStore } from './session-store';
import { api } from '../../lib/api-client';

function useAuthMutation<T>(path: string) {
  return useMutation({
    mutationFn: (input: T) =>
      api<AuthResponse>(path, { method: 'POST', body: input, schema: authResponseSchema }),
    onSuccess: (auth) => {
      useSessionStore.getState().signIn(auth);
    },
  });
}

export const useLoginMutation = () => useAuthMutation<LoginInput>('/auth/login');

export const useRegisterMutation = () => useAuthMutation<RegisterInput>('/auth/register');

/** Ends the session and drops every cached owner query (the next owner must not see them). */
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endSession,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['owner'] });
    },
  });
}
