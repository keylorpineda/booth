import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonVariants } from '../components/ui/button';
import { AuthLayout } from '../features/auth/components/auth-layout';
import { SignOutButton } from '../features/auth/components/sign-out-button';
import { useSessionStore } from '../features/auth/session-store';

/** Placeholder home of the dashboard; the layout, orders, catalog and settings come next. */
export function DashboardPage() {
  const { t } = useTranslation();
  const store = useSessionStore((state) => state.session?.store);
  if (!store) return null;

  return (
    <AuthLayout title={store.name} subtitle={t('dashboard.welcome')} footer={<SignOutButton />}>
      <title>{`${store.name} · Booth`}</title>
      <Link
        to={`/s/${store.slug}`}
        target="_blank"
        className={buttonVariants({ variant: 'outline', block: true })}
      >
        {t('dashboard.viewStore')}
        <ExternalLink className="size-4" />
      </Link>
    </AuthLayout>
  );
}
