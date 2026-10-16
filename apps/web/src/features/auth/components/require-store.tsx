import { Navigate, Outlet } from 'react-router';

import { useSessionStore } from '../session-store';

/** Dashboard routes need a store: owners who skipped onboarding are sent back to it. */
export function RequireStore() {
  const hasStore = useSessionStore((state) => Boolean(state.session?.store));
  return hasStore ? <Outlet /> : <Navigate to="/onboarding" replace />;
}
