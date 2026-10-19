import { House } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';

import { NotFoundState } from '../../../components/feedback/not-found-state';
import { buttonVariants } from '../../../components/ui/button';
import { canOpenPath } from '../../dashboard/nav-items';
import { useSessionStore } from '../session-store';

/**
 * Dashboard sections follow the same role rules as the navigation, so a staff member who opens a
 * link to a section they cannot use gets an explanation instead of a broken page.
 */
export function RequireRole() {
  const { t } = useTranslation();
  const role = useSessionStore((state) => state.session?.role);
  const { pathname } = useLocation();

  if (canOpenPath(pathname, role)) return <Outlet />;

  return (
    <NotFoundState
      title={t('dashboard.noPermissionTitle')}
      description={t('dashboard.noPermissionDescription')}
      action={
        <Link to="/dashboard" className={buttonVariants({ variant: 'outline' })}>
          <House className="size-4" />
          {t('dashboard.backHome')}
        </Link>
      }
    />
  );
}
