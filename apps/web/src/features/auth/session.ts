import { type AuthResponse, authResponseSchema } from '@booth/shared';

import { useSessionStore } from './session-store';
import { api } from '../../lib/api-client';

let inFlight: Promise<boolean> | null = null;

/**
 * Exchanges the refresh cookie for a new access token. Every caller shares one request: refresh
 * tokens rotate and a replayed one revokes the whole session, so two parallel refreshes would
 * sign the owner out.
 */
export function refreshSession(): Promise<boolean> {
  inFlight ??= api<AuthResponse>('/auth/refresh', { method: 'POST', schema: authResponseSchema })
    .then((auth) => {
      useSessionStore.getState().signIn(auth);
      return true;
    })
    .catch(() => {
      // Only an owner who was signed in lost something; a first visit without a cookie did not.
      const { status, signOut } = useSessionStore.getState();
      signOut({ expired: status === 'signedIn' });
      return false;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Revokes the session on the server (best effort) and forgets it locally. */
export async function endSession(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST' });
  } finally {
    useSessionStore.getState().signOut();
  }
}
