import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type PublicCatalog, type PublicProduct } from '@booth/shared';

import { CartBar } from '../../cart/components/cart-bar';
import { CartSheet } from '../../cart/components/cart-sheet';
import { useCart } from '../../cart/use-cart';
import { useStoreContext } from '../store-context';
import { CategoryTabs } from './category-tabs';
import { LastOrderBanner } from './last-order-banner';
import { ProductSection } from './product-section';
import { ProductSheet } from './product-sheet';
import { StoreHeader } from './store-header';
import { StoreMeta } from './store-meta';

/** The storefront once the store is loaded: header, categories, products and the cart. */
export function StorefrontView({ catalog }: { catalog: PublicCatalog }) {
  const { t } = useTranslation();
  const { slug } = useStoreContext();
  const cart = useCart(slug, catalog);
  const [openProduct, setOpenProduct] = useState<PublicProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const sections = [
    ...catalog.categories.map((category) => ({
      id: `cat-${category.id}`,
      title: category.name,
      products: category.products,
    })),
    ...(catalog.uncategorized.length > 0
      ? [{ id: 'cat-more', title: t('storefront.more'), products: catalog.uncategorized }]
      : []),
  ];

  return (
    <>
      <StoreMeta />
      <StoreHeader />
      <LastOrderBanner />
      <CategoryTabs tabs={sections.map(({ id, title }) => ({ id, label: title }))} />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pt-6 pb-32">
        {sections.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">{t('storefront.emptyCatalog')}</p>
        ) : (
          sections.map((section) => (
            <ProductSection key={section.id} {...section} cart={cart} onOpen={setOpenProduct} />
          ))
        )}
      </main>
      <CartBar
        count={cart.count}
        subtotalMinor={cart.subtotalMinor}
        onOpen={() => {
          setCartOpen(true);
        }}
      />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} cart={cart} />
      <ProductSheet
        product={openProduct}
        cart={cart}
        onClose={() => {
          setOpenProduct(null);
        }}
      />
    </>
  );
}
