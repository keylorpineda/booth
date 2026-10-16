import { useTranslation } from 'react-i18next';

import { StoreSignIllustration } from '../components/illustrations/store-sign';
import { EmptyState } from '../components/ui/empty-state';

type Section = 'catalog' | 'settings';

/** Placeholder for the sections that land in the next issues (#20 catalog, #21 settings). */
export function DashboardSectionPage({ section }: { section: Section }) {
  const { t } = useTranslation();

  return (
    <div>
      <title>{`${t(`dashboard.nav.${section}`)} · Booth`}</title>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t(`dashboard.nav.${section}`)}</h1>
      <div className="mt-10">
        <EmptyState
          illustration={<StoreSignIllustration label="…" />}
          title={t('dashboard.soon.title')}
          description={t('dashboard.soon.text')}
        />
      </div>
    </div>
  );
}

export const CatalogSectionPage = () => <DashboardSectionPage section="catalog" />;
export const SettingsSectionPage = () => <DashboardSectionPage section="settings" />;
