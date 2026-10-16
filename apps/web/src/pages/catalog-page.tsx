import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { StoreSignIllustration } from '../components/illustrations/store-sign';
import { EmptyState } from '../components/ui/empty-state';
import { TabPanel, Tabs } from '../components/ui/tabs';
import { CategoriesPanel } from '../features/catalog-admin/categories/categories-panel';

const TABS = ['products', 'categories'] as const;
type CatalogTab = (typeof TABS)[number];

/** Catalog management: products and the categories that group them. Tab kept in the URL. */
export function CatalogPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const tab: CatalogTab = params.get('tab') === 'categories' ? 'categories' : 'products';

  return (
    <div>
      <title>{`${t('dashboard.nav.catalog')} · Booth`}</title>
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dashboard.nav.catalog')}</h1>
      <Tabs
        className="mt-4"
        value={tab}
        onValueChange={(next) => {
          setParams(next === 'products' ? {} : { tab: next });
        }}
        tabs={TABS.map((value) => ({ value, label: t(`catalog.tabs.${value}`) }))}
      >
        <TabPanel value="products">
          {/* The products list lands in #48. */}
          <EmptyState
            illustration={<StoreSignIllustration label="…" />}
            title={t('dashboard.soon.title')}
            description={t('dashboard.soon.text')}
          />
        </TabPanel>
        <TabPanel value="categories">
          <CategoriesPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
}
