import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { type Product } from '@booth/shared';

import { ProductRow } from './product-row';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Pan de ajo',
  description: null,
  priceMinor: 250_000,
  categoryId: 'c1',
  trackStock: true,
  stock: 3,
  isActive: true,
  position: 0,
  images: [],
  createdAt: '2026-10-16T12:00:00.000Z',
  updatedAt: '2026-10-16T12:00:00.000Z',
  ...overrides,
});

const renderRow = (props: Partial<Parameters<typeof ProductRow>[0]> = {}) =>
  render(
    <MemoryRouter>
      <ul>
        <ProductRow
          product={product()}
          categoryName="Panes"
          price="₡2 500"
          move={null}
          {...props}
        />
      </ul>
    </MemoryRouter>,
  );

describe('ProductRow', () => {
  it('shows price, category, stock and a low stock badge', () => {
    renderRow();
    expect(screen.getByText('Pan de ajo')).toBeInTheDocument();
    expect(screen.getByText('₡2 500')).toBeInTheDocument();
    expect(screen.getByText(/Panes · 3 disponibles/)).toBeInTheDocument();
    expect(screen.getByText('Quedan pocos')).toBeInTheDocument();
  });

  it('hides stock for made-to-order products and names missing categories', () => {
    renderRow({ product: product({ trackStock: false, stock: 0 }), categoryName: null });
    expect(screen.getByText(/Sin categoría/)).toBeInTheDocument();
    expect(screen.queryByText(/disponible/)).not.toBeInTheDocument();
    expect(screen.queryByText('Agotado')).not.toBeInTheDocument();
  });

  it('offers reorder buttons only when allowed', () => {
    const onMove = vi.fn();
    const { unmount } = renderRow();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    unmount();

    renderRow({ move: { up: false, down: true, onMove } });
    expect(screen.getByRole('button', { name: 'Subir Pan de ajo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Bajar Pan de ajo' }));
    expect(onMove).toHaveBeenCalledWith(1);
  });
});
