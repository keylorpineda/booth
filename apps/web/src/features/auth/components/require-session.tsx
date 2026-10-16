import { Navigate, Outlet, useLocation } from 'react-router';

import { SessionLoading } from './session-loading';
import { useSessionBootstrap } from '../use-session-bootstrap';

/** Owner routes: signed-out visitors go to sign in and come back afterwards. */
export function RequireSession() {
  const status = useSessionBootstrap();
  const location = useLocation();

  if (status === 'unknown') return <SessionLoading />;
  if (status === 'signedOut') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}
