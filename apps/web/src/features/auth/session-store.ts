import { create } from 'zustand';

import { type AuthResponse, type Session } from '@booth/shared';

export type SessionStatus = 'unknown' | 'signedIn' | 'signedOut';

interface SessionState {
  /** Short-lived access token. Kept in memory only: never in localStorage (XSS). */
  accessToken: string | null;
  session: Session | null;
  status: SessionStatus;
  signIn: (auth: AuthResponse) => void;
  setSession: (session: Session) => void;
  signOut: () => void;
}

/**
 * Not persisted on purpose: after a reload the session is restored from the httpOnly refresh
 * cookie (see refreshSession), so a stolen localStorage could never hold a usable token.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  accessToken: null,
  session: null,
  status: 'unknown',
  signIn: ({ accessToken, user, store, role }) => {
    set({ accessToken, session: { user, store, role: role ?? 'OWNER' }, status: 'signedIn' });
  },
  setSession: (session) => {
    set({ session });
  },
  signOut: () => {
    set({ accessToken: null, session: null, status: 'signedOut' });
  },
}));
