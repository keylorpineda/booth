import { type ReceiptExtractionResult } from '@booth/shared';

import { type ReceiptExtractorService } from './receipt-extractor.service';
import { ReceiptVerificationService } from './receipt-verification.service';
import { type PrismaService } from '../prisma/prisma.service';

describe('ReceiptVerificationService', () => {
  const baseOrder = {
    id: 'order_1',
    storeId: 'store_1',
    code: 'ORD-101',
    status: 'PENDING',
    paymentStatus: 'RECEIPT_SUBMITTED',
    totalMinor: 500000n, // 5000 CRC
    currency: 'CRC',
    createdAt: new Date('2026-10-17T12:00:00.000Z'),
    store: { id: 'store_1', name: 'Panadería La Esquina' },
    // The SINPE Móvil number the customer was asked to pay: not the store WhatsApp.
    paymentMethod: { accountIdentifier: '8888-1111' },
  };

  const matching: ReceiptExtractionResult = {
    amountMinor: 500000,
    currency: 'CRC',
    referenceNumber: 'SINPE-998877',
    recipientPhone: '+506 8888 1111',
    recipientName: 'Panadería La Esquina',
    senderName: 'Carlos M',
    transactionDate: '2026-10-17T11:45:00.000Z',
    bankName: 'BAC Credomatic',
    confidence: 'HIGH',
    rawSummary: 'Transferencia SINPE por ₡5.000',
  };

  function setup(extracted: Partial<ReceiptExtractionResult> | null, order = baseOrder) {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest.fn(),
      },
      receiptVerification: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest
          .fn()
          .mockImplementation(({ create }: { create: object }) =>
            Promise.resolve({ id: 'verif_1', ...create }),
          ),
      },
      orderStatusEvent: { create: jest.fn() },
    };
    const extractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue(extracted && { ...matching, ...extracted }),
    };
    const service = new ReceiptVerificationService(
      prisma as unknown as PrismaService,
      extractor as ReceiptExtractorService,
    );
    const verify = () =>
      service.verifyReceipt('order_1', 'receipt_1', Buffer.from('x'), 'image/jpeg');
    return { prisma, verify };
  }

  it('marks a matching receipt as MATCHED but never confirms the payment itself', async () => {
    const { prisma, verify } = setup({});

    const result = await verify();

    expect(result.status).toBe('MATCHED');
    expect(result.rejectionReason).toBeNull();
    // The owner confirms after checking the bank: no PAID, no system event.
    expect(prisma.order.update).not.toHaveBeenCalled();
    expect(prisma.orderStatusEvent.create).not.toHaveBeenCalled();
  });

  it('accepts a SINPE number that differs from the store WhatsApp when it is the chosen account', async () => {
    const { verify } = setup({ recipientPhone: '88881111' });
    expect((await verify()).status).toBe('MATCHED');
  });

  it('flags RECIPIENT_MISMATCH when the money went to another account', async () => {
    const { verify } = setup({ recipientPhone: '+50611112222' });
    const result = await verify();
    expect(result.status).toBe('RECIPIENT_MISMATCH');
    expect(result.rejectionReason).toContain('does not match the payment account');
  });

  it('skips the recipient check when the chosen method is not phone-like (IBAN)', async () => {
    const { verify } = setup(
      { recipientPhone: '+50611112222' },
      { ...baseOrder, paymentMethod: { accountIdentifier: 'CR05 0152 0200 1026 2840 66' } },
    );
    expect((await verify()).status).toBe('MATCHED');
  });

  it('flags AMOUNT_MISMATCH when the amount differs from the order total', async () => {
    const { verify } = setup({ amountMinor: 300000 });
    const result = await verify();
    expect(result.status).toBe('AMOUNT_MISMATCH');
    expect(result.rejectionReason).toContain('does not match order total');
  });

  it('flags DUPLICATE_REFERENCE when the reference was already matched on another order', async () => {
    const { prisma, verify } = setup({});
    prisma.receiptVerification.findFirst.mockResolvedValueOnce({
      id: 'existing',
      referenceNumber: 'SINPE-998877',
      status: 'MATCHED',
      receipt: { order: { code: 'ORD-PREV-88' } },
    });
    const result = await verify();
    expect(result.status).toBe('DUPLICATE_REFERENCE');
    expect(result.rejectionReason).toContain('ORD-PREV-88');
  });

  it('marks UNVERIFIED when the transaction is older than 48 hours', async () => {
    const { verify } = setup({ transactionDate: '2026-10-10T12:00:00.000Z' });
    const result = await verify();
    expect(result.status).toBe('UNVERIFIED');
    expect(result.rejectionReason).toContain('older than 48 hours');
  });

  it('marks UNVERIFIED when the image is unreadable or AI is not configured', async () => {
    const blurry = setup({ amountMinor: null, referenceNumber: null, confidence: 'LOW' });
    expect((await blurry.verify()).status).toBe('UNVERIFIED');

    const disabled = setup(null);
    expect((await disabled.verify()).status).toBe('UNVERIFIED');
  });
});
