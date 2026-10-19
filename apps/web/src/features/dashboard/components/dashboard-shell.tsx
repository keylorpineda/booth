import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';
import { toast } from 'sonner';

import { AccountMenu } from './account-menu';
import { BottomNav } from './bottom-nav';
import { DemoBanner } from './demo-banner';
import { Sidebar } from './sidebar';
import { Logo } from '../../../components/brand/logo';
import { buttonVariants } from '../../../components/ui/button';
import { useSessionStore } from '../../auth/session-store';
import { AlertsToggle } from '../../notifications/components/alerts-toggle';
import { useAlertsSetting } from '../../notifications/use-alerts-setting';
import { useOrderAlerts } from '../../notifications/use-order-alerts';

/** Frame of every dashboard screen: sidebar from md up, bottom navigation on phones. */
export function DashboardShell() {
  const { t } = useTranslation();
  const store = useSessionStore((state) => state.session?.store);
  const [alerts, toggleAlerts] = useAlertsSetting();
  useOrderAlerts(alerts);

  return (
    <div className="flex min-h-dvh bg-surface-sunken/50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-surface-raised/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Link to="/dashboard" className="md:hidden" aria-label="Booth">
              <Logo withText={false} />
            </Link>
            <p className="min-w-0 flex-1 truncate font-display text-lg font-bold">{store?.name}</p>
            {store ? (
              <a
                href={`/s/${store.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t('dashboard.viewStore')}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <ExternalLink className="size-4" />
                <span className="hidden sm:inline">{t('dashboard.viewStore')}</span>
              </a>
            ) : null}
            <AlertsToggle
              setting={alerts}
              onToggle={() => {
                if (alerts === 'blocked') toast(t('alerts.blockedHelp'));
                else void toggleAlerts();
              }}
            />
            <AccountMenu />
          </div>
          <DemoBanner />
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
