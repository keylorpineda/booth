import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { formatMoney, type OwnerOrderSummary } from '@booth/shared';

import { OrderRow } from './order-row';

const now = Date.parse('2026-10-16T12:00:00Z');

const order = (overrides: Partial<OwnerOrderSummary> = {}): OwnerOrderSummary => ({
  id: 'o1',
  code: 'K7Q2MX',
  status: 'PENDING',
  paymentStatus: 'RECEIPT_SUBMITTED',
  customerName: 'Ana Mora',
  customerPhone: '+50688881234',
  fulfillment: 'DELIVERY',
  paymentMethodKind: 'TRANSFER',
  paymentMethodLabel: 'SINPE Móvil',
  currency: 'CRC',
  totalMinor: 750_000,
  itemCount: 3,
  hasReceipt: true,
  expiresAt: new Date(now + 12 * 60_000).toISOString(),
  createdAt: new Date(now - 5 * 60_000).toISOString(),
  ...overrides,
});

const renderRow = (summary: OwnerOrderSummary) =>
  render(
    <MemoryRouter>
      <OrderRow
        order={summary}
        now={now}
        formatMoney={(minor, currency) => formatMoney(minor, currency, 'es-CR')}
      />
    </MemoryRouter>,
  );

describe('OrderRow', () => {
  it('shows the code, customer, total in the order currency and time left', () => {
    renderRow(order());
    expect(screen.getByRole('link')).toHaveAttribute('href', '/dashboard/orders/o1');
    expect(screen.getByText('#K7Q2MX')).toBeInTheDocument();
    expect(screen.getByText('Ana Mora')).toBeInTheDocument();
    expect(screen.getByText('₡7 500')).toBeInTheDocument();
    expect(screen.getByText('Vence en 12 min')).toBeInTheDocument();
    expect(screen.getByText('Comprobante por revisar')).toBeInTheDocument();
  });

  it('hides the countdown once the order is no longer pending', () => {
    renderRow(order({ status: 'CONFIRMED', paymentStatus: 'PAID' }));
    expect(screen.queryByText(/Vence en/)).not.toBeInTheDocument();
    expect(screen.getByText('Pagado')).toBeInTheDocument();
  });

  it('labels unpaid cash orders as cash on delivery, not as a debt', () => {
    renderRow(order({ paymentMethodKind: 'CASH', paymentStatus: 'UNPAID' }));
    expect(screen.getByText('Efectivo al entregar')).toBeInTheDocument();
    expect(screen.queryByText('Sin pagar')).not.toBeInTheDocument();
  });
});
