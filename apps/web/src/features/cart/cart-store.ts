import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_ITEM_QUANTITY, MAX_ORDER_LINES } from '@booth/shared';

/** productId -> quantity */
export type CartItems = Record<string, number>;

export interface LastOrder {
  code: string;
  trackingToken: string;
  whatsappUrl: string;
  totalMinor: number;
  placedAt: string;
}

interface CartState {
  /** One cart per store slug, so carts from different stores never mix. */
  carts: Record<string, CartItems>;
  /** The most recent order per store, to reopen WhatsApp or tracking after switching apps. */
  lastOrders: Record<string, LastOrder>;
  setQuantity: (slug: string, productId: string, quantity: number, max?: number) => void;
  add: (slug: string, productId: string, quantity: number, max?: number) => void;
  clear: (slug: string) => void;
  rememberOrder: (slug: string, order: LastOrder) => void;
}

const clamp = (value: number, max = MAX_ITEM_QUANTITY) =>
  Math.max(0, Math.min(Math.floor(value), max, MAX_ITEM_QUANTITY));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      lastOrders: {},
      setQuantity: (slug, productId, quantity, max) => {
        set((state) => {
          const { [productId]: current, ...others } = state.carts[slug] ?? {};
          const next = clamp(quantity, max);
          if (next > 0 && current === undefined && Object.keys(others).length >= MAX_ORDER_LINES) {
            return state;
          }
          const cart = next === 0 ? others : { ...others, [productId]: next };
          return { carts: { ...state.carts, [slug]: cart } };
        });
      },
      add: (slug, productId, quantity, max) => {
        set((state) => {
          const cart = { ...state.carts[slug] };
          if (!(productId in cart) && Object.keys(cart).length >= MAX_ORDER_LINES) return state;
          cart[productId] = clamp((cart[productId] ?? 0) + quantity, max);
          return { carts: { ...state.carts, [slug]: cart } };
        });
      },
      clear: (slug) => {
        set((state) => ({ carts: { ...state.carts, [slug]: {} } }));
      },
      rememberOrder: (slug, order) => {
        set((state) => ({ lastOrders: { ...state.lastOrders, [slug]: order } }));
      },
    }),
    {
      name: 'booth.cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
