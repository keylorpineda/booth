import { Navigate, Outlet, useSearchParams } from 'react-router';

import { SessionLoading } from './session-loading';
import { safeRedirect } from '../auth-forms';
import { useSessionBootstrap } from '../use-session-bootstrap';

/** Sign in and sign up: a signed-in owner (or one who just signed in) moves on. */
export function GuestOnly() {
  const status = useSessionBootstrap();
  const [params] = useSearchParams();

  if (status === 'unknown') return <SessionLoading />;
  if (status === 'signedIn') return <Navigate to={safeRedirect(params.get('redirect'))} replace />;
  return <Outlet />;
}
