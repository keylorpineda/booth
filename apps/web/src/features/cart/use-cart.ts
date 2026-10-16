import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { type PublicCatalog, type PublicProduct } from '@booth/shared';

import { type CartItems, useCartStore } from './cart-store';

export interface CartLine {
  product: PublicProduct;
  quantity: number;
  lineTotalMinor: number;
}

const EMPTY: CartItems = {};

export function allProducts(catalog: PublicCatalog | undefined): PublicProduct[] {
  if (!catalog) return [];
  return [...catalog.categories.flatMap((category) => category.products), ...catalog.uncategorized];
}

/** Maximum a customer can add: the stock left for tracked products, otherwise the order limit. */
export function maxQuantity(product: PublicProduct): number | undefined {
  return product.stockLeft ?? undefined;
}

/**
 * The cart for one store joined with the live catalog. Products that disappeared or sold out are
 * left out. Totals here are a preview: the server recomputes every price at checkout.
 */
export function useCart(slug: string, catalog: PublicCatalog | undefined) {
  const items = useCartStore((state) => state.carts[slug] ?? EMPTY);
  const actions = useCartStore(
    useShallow((state) => ({ setQuantity: state.setQuantity, add: state.add, clear: state.clear })),
  );

  return useMemo(() => {
    const byId = new Map(allProducts(catalog).map((product) => [product.id, product]));
    const lines: CartLine[] = Object.entries(items).flatMap(([productId, quantity]) => {
      const product = byId.get(productId);
      if (!product?.available) return [];
      return [{ product, quantity, lineTotalMinor: product.priceMinor * quantity }];
    });

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotalMinor: lines.reduce((sum, line) => sum + line.lineTotalMinor, 0),
      quantityOf: (productId: string) => items[productId] ?? 0,
      setQuantity: (product: PublicProduct, quantity: number) => {
        actions.setQuantity(slug, product.id, quantity, maxQuantity(product));
      },
      add: (product: PublicProduct, quantity = 1) => {
        actions.add(slug, product.id, quantity, maxQuantity(product));
      },
      clear: () => {
        actions.clear(slug);
      },
    };
  }, [items, catalog, actions, slug]);
}

export type Cart = ReturnType<typeof useCart>;
