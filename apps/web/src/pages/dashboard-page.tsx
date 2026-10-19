import { useTranslation } from 'react-i18next';

import { ErrorState } from '../components/feedback/error-state';
import { useSessionStore } from '../features/auth/session-store';
import { SetupChecklistCard } from '../features/dashboard/components/setup-checklist-card';
import { ShareStoreCard } from '../features/dashboard/components/share-store-card';
import { useSetupChecklist } from '../features/dashboard/use-setup-checklist';

/** Dashboard home: what is left to set up and the link to share. */
export function DashboardPage() {
  const { t } = useTranslation();
  const session = useSessionStore((state) => state.session);
  const { steps, error } = useSetupChecklist();
  if (!session?.store) return null;

  const firstName = session.user.name.split(/\s+/)[0] ?? '';

  return (
    <div>
      <title>{`${t('dashboard.nav.home')} · ${session.store.name}`}</title>
      <h1 className="text-2xl font-extrabold sm:text-3xl">
        {t('dashboard.greeting', { name: firstName })}
      </h1>
      <p className="mt-1 text-ink-muted">{t('dashboard.welcome')}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {error ? <ErrorState error={error} /> : <SetupChecklistCard steps={steps} />}
        <ShareStoreCard slug={session.store.slug} name={session.store.name} />
      </div>
    </div>
  );
}
