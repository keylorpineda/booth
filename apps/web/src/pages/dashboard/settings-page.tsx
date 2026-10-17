import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ErrorState } from '../../components/feedback/error-state';
import { StoreSignIllustration } from '../../components/illustrations/store-sign';
import { EmptyState } from '../../components/ui/empty-state';
import { Skeleton } from '../../components/ui/skeleton';
import { TabPanel, Tabs } from '../../components/ui/tabs';
import { useOwnerStore } from '../../features/dashboard/api';
import { OrderingPanel } from '../../features/settings/ordering/ordering-panel';
import { PaymentMethodsPanel } from '../../features/settings/payment-methods/payment-methods-panel';
import { ProfilePanel } from '../../features/settings/profile/profile-panel';

const TABS = ['profile', 'delivery', 'payments', 'hours', 'localization'] as const;
type SettingsTab = (typeof TABS)[number];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

/** Store settings: profile & branding, ordering & zones, payment methods, hours and localization. */
export function SettingsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const tab: SettingsTab = isSettingsTab(rawTab) ? rawTab : 'profile';
  const store = useOwnerStore();

  if (store.error) return <ErrorState error={store.error} onRetry={() => void store.refetch()} />;

  return (
    <div>
      <title>{`${t('dashboard.nav.settings')} · Booth`}</title>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dashboard.nav.settings')}</h1>
      <Tabs
        className="mt-4"
        value={tab}
        onValueChange={(next) => {
          setParams(next === 'profile' ? {} : { tab: next });
        }}
        tabs={TABS.map((value) => ({ value, label: t(`settings.tabs.${value}`) }))}
      >
        <TabPanel value="profile">
          {store.data ? (
            <ProfilePanel store={store.data} />
          ) : (
            <Skeleton className="h-[32rem] max-w-2xl rounded-card" />
          )}
        </TabPanel>
        <TabPanel value="delivery">
          {store.data ? (
            <OrderingPanel store={store.data} />
          ) : (
            <Skeleton className="h-[32rem] max-w-2xl rounded-card" />
          )}
        </TabPanel>
        <TabPanel value="payments">
          {store.data ? (
            <PaymentMethodsPanel store={store.data} />
          ) : (
            <Skeleton className="h-[32rem] max-w-2xl rounded-card" />
          )}
        </TabPanel>
        {(['hours', 'localization'] as const).map((upcoming) => (
          <TabPanel key={upcoming} value={upcoming}>
            <EmptyState
              illustration={<StoreSignIllustration label="…" />}
              title={t('dashboard.soon.title')}
              description={t('dashboard.soon.text')}
            />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
