import { beforeEach, describe, expect, it } from 'vitest';

import { MAX_ITEM_QUANTITY } from '@booth/shared';

import { useCartStore } from './cart-store';

const state = () => useCartStore.getState();

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.setState({ carts: {}, lastOrders: {} });
  });

  it('keeps one cart per store', () => {
    state().add('bakery', 'bread', 2);
    state().add('cafe', 'latte', 1);

    expect(state().carts).toEqual({ bakery: { bread: 2 }, cafe: { latte: 1 } });
  });

  it('adds up quantities and never exceeds the stock left', () => {
    state().add('bakery', 'cake', 1, 3);
    state().add('bakery', 'cake', 5, 3);

    expect(state().carts.bakery).toEqual({ cake: 3 });
  });

  it('caps quantities at the order limit', () => {
    state().setQuantity('bakery', 'bread', 500);

    expect(state().carts.bakery?.bread).toBe(MAX_ITEM_QUANTITY);
  });

  it('removes a line when the quantity reaches zero', () => {
    state().add('bakery', 'bread', 1);
    state().setQuantity('bakery', 'bread', 0);

    expect(state().carts.bakery).toEqual({});
  });

  it('clears only the given store', () => {
    state().add('bakery', 'bread', 1);
    state().add('cafe', 'latte', 1);
    state().clear('bakery');

    expect(state().carts).toEqual({ bakery: {}, cafe: { latte: 1 } });
  });

  it('persists to localStorage', () => {
    state().add('bakery', 'bread', 2);

    expect(localStorage.getItem('booth.cart')).toContain('"bread":2');
  });
});
