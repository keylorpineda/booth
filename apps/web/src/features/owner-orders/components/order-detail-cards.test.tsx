import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatMoney, type OwnerOrder } from '@booth/shared';

import { CustomerCard } from './customer-card';
import { FulfillmentCard } from './fulfillment-card';
import { OrderItemsCard } from './order-items-card';
import { OrderTimeline } from './order-timeline';

const order: OwnerOrder = {
  id: 'o1',
  code: 'K7Q2MX',
  status: 'CONFIRMED',
  paymentStatus: 'UNPAID',
  customerName: 'Ana Mora',
  customerPhone: '+50688881234',
  customerNote: 'Sin azúcar, por favor',
  fulfillment: 'DELIVERY',
  deliveryZoneName: 'Escazú',
  deliveryAddress: 'Casa azul frente al parque',
  paymentMethodKind: 'TRANSFER',
  paymentMethodLabel: 'SINPE Móvil',
  currency: 'CRC',
  subtotalMinor: 600_000,
  deliveryFeeMinor: 150_000,
  totalMinor: 750_000,
  itemCount: 2,
  hasReceipt: false,
  expiresAt: null,
  createdAt: '2026-10-16T12:00:00.000Z',
  // The name and price stored when the order was placed (the product may have changed since).
  items: [
    {
      id: 'i1',
      productId: null,
      name: 'Pan de masa madre (receta vieja)',
      unitPriceMinor: 300_000,
      quantity: 2,
      lineTotalMinor: 600_000,
    },
  ],
  events: [
    { status: 'PENDING', actor: 'customer', note: null, at: '2026-10-16T12:00:00.000Z' },
    { status: 'CONFIRMED', actor: 'owner', note: null, at: '2026-10-16T12:05:00.000Z' },
  ],
  receipt: null,
  trackingToken: 'token',
  privacyConsentAt: '2026-10-16T12:00:00.000Z',
};

const money = (minor: number, currency: string) => formatMoney(minor, currency, 'es-CR');

describe('order detail cards', () => {
  it('shows the snapshot lines and totals in the order currency', () => {
    render(<OrderItemsCard order={order} formatMoney={money} />);
    expect(screen.getByText('Pan de masa madre (receta vieja)')).toBeInTheDocument();
    expect(screen.getByText('₡1 500')).toBeInTheDocument(); // delivery fee
    expect(screen.getByText('₡7 500')).toBeInTheDocument(); // total
  });

  it('shows the delivery zone, address and payment method', () => {
    render(<FulfillmentCard order={order} />);
    expect(screen.getByText('Escazú')).toBeInTheDocument();
    expect(screen.getByText('Casa azul frente al parque')).toBeInTheDocument();
    expect(screen.getByText('SINPE Móvil')).toBeInTheDocument();
  });

  it('opens WhatsApp with the customer number and the order code', () => {
    render(<CustomerCard order={order} />);
    const link = screen.getByRole('link', { name: /WhatsApp/ });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/50688881234\?text=.*K7Q2MX/);
    expect(screen.getByText('Sin azúcar, por favor')).toBeInTheDocument();
  });

  it('lists every status change with who made it', () => {
    render(<OrderTimeline order={order} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/Cliente/)).toBeInTheDocument();
    expect(screen.getByText(/Tú/)).toBeInTheDocument();
  });
});
