import { useEffect } from 'react';

import { refreshSession } from './session';
import { type SessionStatus, useSessionStore } from './session-store';

/** Restores the session from the refresh cookie on first use; returns the current status. */
export function useSessionBootstrap(): SessionStatus {
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    if (status === 'unknown') void refreshSession();
  }, [status]);

  return status;
}
