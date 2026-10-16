import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { type PublicProduct, type PublicStore } from '@booth/shared';

import { ProductCard } from './product-card';
import { type Cart } from '../../cart/use-cart';
import { StoreProvider } from '../store-context';

const store = {
  slug: 'bakery',
  name: 'Panadería',
  currency: 'CRC',
  country: 'CR',
} as PublicStore;

const product = (overrides: Partial<PublicProduct> = {}): PublicProduct => ({
  id: 'p1',
  name: 'Pan de ajo',
  description: 'Recién horneado',
  priceMinor: 250000,
  images: [],
  available: true,
  stockLeft: null,
  ...overrides,
});

function cartWith(quantity = 0): Cart {
  return {
    lines: [],
    count: quantity,
    subtotalMinor: 0,
    quantityOf: () => quantity,
    setQuantity: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
  };
}

const renderCard = (item: PublicProduct, cart = cartWith()) =>
  render(
    <StoreProvider store={store}>
      <ProductCard product={item} cart={cart} onOpen={vi.fn()} />
    </StoreProvider>,
  );

describe('ProductCard', () => {
  it('shows the price in the store currency without a zero fraction', () => {
    renderCard(product());

    expect(screen.getByText(/₡\s?2\s?500/)).toBeInTheDocument();
  });

  it('adds the product to the cart', async () => {
    const cart = cartWith();
    renderCard(product(), cart);

    await userEvent.click(screen.getByRole('button', { name: 'Agregar Pan de ajo' }));

    expect(cart.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
  });

  it('shows a stepper once the product is in the cart', () => {
    renderCard(product(), cartWith(2));

    expect(screen.getByRole('button', { name: 'Aumentar cantidad' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Pan de ajo' })).not.toBeInTheDocument();
  });

  it('marks sold out products and hides the add button', () => {
    renderCard(product({ available: false, stockLeft: 0 }));

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar Pan de ajo' })).not.toBeInTheDocument();
  });

  it('warns when few units are left', () => {
    renderCard(product({ stockLeft: 2 }));

    expect(screen.getByText('¡Quedan 2!')).toBeInTheDocument();
  });
});
