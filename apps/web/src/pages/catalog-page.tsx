import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { TabPanel, Tabs } from '../components/ui/tabs';
import { CategoriesPanel } from '../features/catalog-admin/categories/categories-panel';
import { AddProductLink } from '../features/catalog-admin/products/add-product-link';
import { ProductsPanel } from '../features/catalog-admin/products/products-panel';

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{t('dashboard.nav.catalog')}</h1>
        {tab === 'products' ? <AddProductLink /> : null}
      </div>
      <Tabs
        className="mt-4"
        value={tab}
        onValueChange={(next) => {
          // Filters belong to the products tab; switching tabs starts clean.
          setParams(next === 'products' ? {} : { tab: next });
        }}
        tabs={TABS.map((value) => ({ value, label: t(`catalog.tabs.${value}`) }))}
      >
        <TabPanel value="products">
          <ProductsPanel />
        </TabPanel>
        <TabPanel value="categories">
          <CategoriesPanel />
        </TabPanel>
      </Tabs>
    </div>
  );
}
