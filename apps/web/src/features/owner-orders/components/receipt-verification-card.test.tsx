import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatMoney, type OwnerOrder } from '@booth/shared';

import { ReceiptVerificationCard } from './receipt-verification-card';
import { useSessionStore } from '../../auth/session-store';
import { type useOrderActions } from '../use-order-actions';

const baseOrder: OwnerOrder = {
  id: 'o1',
  code: 'K7Q2MX',
  status: 'CONFIRMED',
  paymentStatus: 'RECEIPT_SUBMITTED',
  customerName: 'Ana Mora',
  customerPhone: '+50688881234',
  customerNote: null,
  fulfillment: 'DELIVERY',
  deliveryZoneName: 'Escazú',
  deliveryAddress: 'Calle 1',
  paymentMethodKind: 'TRANSFER',
  paymentMethodLabel: 'SINPE Móvil',
  currency: 'CRC',
  subtotalMinor: 600_000,
  deliveryFeeMinor: 150_000,
  totalMinor: 750_000,
  itemCount: 2,
  hasReceipt: true,
  expiresAt: null,
  createdAt: '2026-10-16T12:00:00.000Z',
  items: [
    {
      id: 'i1',
      productId: null,
      name: 'Café',
      unitPriceMinor: 375_000,
      quantity: 2,
      lineTotalMinor: 750_000,
    },
  ],
  events: [],
  trackingToken: 'token',
  privacyConsentAt: '2026-10-16T12:00:00.000Z',
  receipt: {
    mimeType: 'image/jpeg',
    bytes: 1024,
    uploadedAt: '2026-10-16T12:05:00.000Z',
    verification: {
      status: 'MATCHED',
      confidence: 'HIGH',
      extracted: {
        amountMinor: 750_000,
        currency: 'CRC',
        recipientPhone: '88881234',
        recipientName: 'La Esquina',
        senderName: 'Ana Mora',
        transactionDate: '16/10/2026 12:04',
        referenceNumber: 'REF-998877',
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia SINPE de ₡7500',
      },
      mismatchReason: null,
      verifiedAt: '2026-10-16T12:05:05.000Z',
    },
  },
};

const money = (minor: number, currency: string) => formatMoney(minor, currency, 'es-CR');

function createMockActions() {
  return {
    receiptUrl: { mutate: vi.fn(), isPending: false } as unknown as ReturnType<
      typeof useOrderActions
    >['receiptUrl'],
    setPayment: { mutate: vi.fn(), isPending: false } as unknown as ReturnType<
      typeof useOrderActions
    >['setPayment'],
  };
}

describe('ReceiptVerificationCard', () => {
  beforeEach(() => {
    useSessionStore.setState({
      status: 'signedIn',
      accessToken: 'token',
      session: {
        user: { id: 'u1', email: 'owner@test.com', name: 'Owner', isDemo: false },
        store: { id: 's1', slug: 'tienda', name: 'Mi Tienda' },
        role: 'OWNER',
      },
    });
  });

  it('shows matched AI verification details with success banner and extracted fields', () => {
    const actions = createMockActions();
    render(<ReceiptVerificationCard order={baseOrder} formatMoney={money} actions={actions} />);

    expect(screen.getAllByText('Parece correcto')).toHaveLength(2);
    expect(
      screen.getByText(
        'El monto, la cuenta y el número coinciden con el pedido. Confirma el pago cuando lo veas en tu banco.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('REF-998877')).toBeInTheDocument();
    expect(screen.getByText('BAC Credomatic')).toBeInTheDocument();
    expect(screen.getByText('88881234')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver comprobante/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar pago/i })).toBeInTheDocument();
  });

  it('shows amount mismatch banner and discrepancy reason', () => {
    const actions = createMockActions();
    const order: OwnerOrder = {
      ...baseOrder,
      receipt: {
        ...baseOrder.receipt!,
        verification: {
          ...baseOrder.receipt!.verification!,
          status: 'AMOUNT_MISMATCH',
          extracted: {
            ...baseOrder.receipt!.verification!.extracted,
            amountMinor: 500_000,
          },
          mismatchReason: 'El monto transferido ₡5,000 no coincide con el total de ₡7,500',
        },
      },
    };

    render(<ReceiptVerificationCard order={order} formatMoney={money} actions={actions} />);

    expect(screen.getAllByText('Monto diferente')).toHaveLength(2);
    expect(
      screen.getByText('El monto transferido ₡5,000 no coincide con el total de ₡7,500'),
    ).toBeInTheDocument();
    expect(screen.getByText('₡5 000')).toBeInTheDocument();
  });

  it('shows duplicate voucher alert when reference was previously used', () => {
    const actions = createMockActions();
    const order: OwnerOrder = {
      ...baseOrder,
      receipt: {
        ...baseOrder.receipt!,
        verification: {
          ...baseOrder.receipt!.verification!,
          status: 'DUPLICATE_REFERENCE',
          mismatchReason: 'Comprobante duplicado: ya fue utilizado en el pedido #A1B2C3',
        },
      },
    };

    render(<ReceiptVerificationCard order={order} formatMoney={money} actions={actions} />);

    expect(screen.getAllByText('Comprobante duplicado')).toHaveLength(2);
    expect(
      screen.getByText('Comprobante duplicado: ya fue utilizado en el pedido #A1B2C3'),
    ).toBeInTheDocument();
  });

  it('shows recipient mismatch alert when destination does not match', () => {
    const actions = createMockActions();
    const order: OwnerOrder = {
      ...baseOrder,
      receipt: {
        ...baseOrder.receipt!,
        verification: {
          ...baseOrder.receipt!.verification!,
          status: 'RECIPIENT_MISMATCH',
          mismatchReason: 'El teléfono destino 89999999 no coincide con el de la tienda',
        },
      },
    };

    render(<ReceiptVerificationCard order={order} formatMoney={money} actions={actions} />);

    expect(screen.getAllByText('Destino diferente')).toHaveLength(2);
    expect(
      screen.getByText('El teléfono destino 89999999 no coincide con el de la tienda'),
    ).toBeInTheDocument();
  });

  it('disables confirmation button in read-only demo mode', () => {
    useSessionStore.setState({
      status: 'signedIn',
      accessToken: 'token',
      session: {
        user: { id: 'u1', email: 'demo@test.com', name: 'Demo', isDemo: true },
        store: { id: 's1', slug: 'demo', name: 'Demo Store' },
        role: 'OWNER',
      },
    });

    const actions = createMockActions();
    render(<ReceiptVerificationCard order={baseOrder} formatMoney={money} actions={actions} />);

    const confirmButton = screen.getByRole('button', { name: /Confirmar pago/i });
    expect(confirmButton).toBeDisabled();
  });

  it('triggers view receipt action and confirm payment mutation', () => {
    const actions = createMockActions();
    render(<ReceiptVerificationCard order={baseOrder} formatMoney={money} actions={actions} />);

    fireEvent.click(screen.getByRole('button', { name: /Ver comprobante/i }));
    expect(actions.receiptUrl.mutate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Confirmar pago/i }));
    expect(actions.setPayment.mutate).toHaveBeenCalledWith('PAID', expect.any(Object));
  });

  it('shows payment confirmed indicator when order is already paid', () => {
    const actions = createMockActions();
    const paidOrder: OwnerOrder = {
      ...baseOrder,
      paymentStatus: 'PAID',
    };

    render(<ReceiptVerificationCard order={paidOrder} formatMoney={money} actions={actions} />);

    expect(screen.getByText('Pago confirmado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirmar pago/i })).not.toBeInTheDocument();
  });
});
