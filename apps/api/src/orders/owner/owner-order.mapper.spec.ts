import { toOwnerOrder, toOwnerOrderSummary } from './owner-order.mapper';

describe('owner-order.mapper', () => {
  const baseOrder = {
    id: 'ord_123',
    storeId: 'str_123',
    code: 'ORD-001',
    status: 'PENDING' as const,
    paymentStatus: 'RECEIPT_SUBMITTED' as const,
    customerName: 'Maria Jimenez',
    customerPhone: '+50688888888',
    customerNote: 'Door code 1234',
    fulfillment: 'DELIVERY' as const,
    paymentMethodKind: 'SINPE_MOVIL' as const,
    paymentMethodLabel: 'SINPE Móvil',
    currency: 'CRC',
    totalMinor: BigInt(500000),
    subtotalMinor: BigInt(450000),
    deliveryFeeMinor: BigInt(50000),
    deliveryZoneName: 'San José Centro',
    deliveryAddress: 'Av Central, Calle 5',
    trackingToken: 'tok_abc123',
    privacyConsentAt: new Date('2026-10-18T00:00:00Z'),
    expiresAt: new Date('2026-10-18T00:15:00Z'),
    createdAt: new Date('2026-10-18T00:00:00Z'),
    updatedAt: new Date('2026-10-18T00:00:00Z'),
  };

  it('maps order summary without receipt verification', () => {
    const summary = toOwnerOrderSummary({
      ...baseOrder,
      receipt: null,
      _count: { items: 2 },
    } as unknown as Parameters<typeof toOwnerOrderSummary>[0]);

    expect(summary.hasReceipt).toBe(false);
    expect(summary.receiptVerificationStatus).toBeNull();
    expect(summary.itemCount).toBe(2);
    expect(summary.totalMinor).toBe(500000);
  });

  it('maps order summary with receipt verification status', () => {
    const summary = toOwnerOrderSummary({
      ...baseOrder,
      receipt: {
        id: 'rec_123',
        verification: { status: 'MATCHED' },
      },
      _count: { items: 3 },
    } as unknown as Parameters<typeof toOwnerOrderSummary>[0]);

    expect(summary.hasReceipt).toBe(true);
    expect(summary.receiptVerificationStatus).toBe('MATCHED');
    expect(summary.itemCount).toBe(3);
  });

  it('maps detailed order with complete verification details', () => {
    const detailed = toOwnerOrder({
      ...baseOrder,
      items: [
        {
          id: 'item_1',
          orderId: 'ord_123',
          productId: 'prod_1',
          productName: 'T-Shirt',
          unitPriceMinor: BigInt(250000),
          quantity: 2,
          lineTotalMinor: BigInt(500000),
        },
      ],
      events: [
        {
          id: 'evt_1',
          orderId: 'ord_123',
          status: 'PENDING',
          actor: 'system',
          note: 'Order created',
          createdAt: new Date('2026-10-18T00:00:00Z'),
        },
      ],
      receipt: {
        id: 'rec_123',
        orderId: 'ord_123',
        mimeType: 'image/jpeg',
        bytes: 1024,
        publicId: 'receipts/rec_123',
        uploadedAt: new Date('2026-10-18T00:05:00Z'),
        createdAt: new Date('2026-10-18T00:05:00Z'),
        verification: {
          id: 'ver_123',
          receiptId: 'rec_123',
          storeId: 'str_123',
          status: 'MATCHED',
          confidence: 'HIGH',
          extractedAmountMinor: BigInt(500000),
          extractedCurrency: 'CRC',
          recipientPhone: '88888888',
          recipientName: 'Booth Store',
          senderName: 'Maria Jimenez',
          transactionDate: '2026-10-18 00:04',
          referenceNumber: 'REF123456',
          bankName: 'BAC Credomatic',
          rawSummary: 'Transfer of 5000 CRC to Booth Store',
          rejectionReason: null,
          verifiedAt: new Date('2026-10-18T00:05:05Z'),
          createdAt: new Date('2026-10-18T00:05:05Z'),
        },
      },
    } as unknown as Parameters<typeof toOwnerOrder>[0]);

    expect(detailed.receipt).not.toBeNull();
    expect(detailed.receipt?.verification?.status).toBe('MATCHED');
    expect(detailed.receipt?.verification?.confidence).toBe('HIGH');
    expect(detailed.receipt?.verification?.extracted.amountMinor).toBe(500000);
    expect(detailed.receipt?.verification?.extracted.referenceNumber).toBe('REF123456');
    expect(detailed.receipt?.verification?.extracted.bankName).toBe('BAC Credomatic');
    expect(detailed.receipt?.verification?.mismatchReason).toBeNull();
  });
});
