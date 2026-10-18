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
    store: {
      id: 'store_1',
      name: 'Panadería La Esquina',
      whatsappPhone: '+50688887777',
    },
  };

  const createMockPrisma = () => {
    const tx = {
      receiptVerification: {
        upsert: jest.fn().mockImplementation(({ create }) =>
          Promise.resolve({
            id: 'verif_1',
            ...create,
          }),
        ),
      },
      order: {
        update: jest.fn().mockResolvedValue({ id: 'order_1', paymentStatus: 'PAID' }),
      },
      orderStatusEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event_1' }),
      },
    };

    return {
      order: {
        findUnique: jest.fn().mockResolvedValue(baseOrder),
      },
      receiptVerification: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest
        .fn()
        .mockImplementation((cb: (t: typeof tx) => Promise<unknown>) => cb(tx)),
      _tx: tx,
    };
  };

  it('auto-approves order and marks status MATCHED when amount and reference match', async () => {
    const mockPrisma = createMockPrisma();
    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: 500000,
        currency: 'CRC',
        referenceNumber: 'SINPE-998877',
        recipientPhone: '+50688887777',
        recipientName: 'Panadería La Esquina',
        senderName: 'Carlos M',
        transactionDate: '2026-10-17T11:45:00.000Z',
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia SINPE por ₡5.000',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('receipt'),
      'image/jpeg',
    );

    expect(result.status).toBe('MATCHED');
    expect(result.autoApproved).toBe(true);
    expect(result.rejectionReason).toBeNull();
    expect(mockPrisma._tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order_1' },
      data: { paymentStatus: 'PAID', expiresAt: null },
    });
    expect(mockPrisma._tx.orderStatusEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order_1',
        actor: 'system',
        note: expect.stringContaining('SINPE-998877'),
      }),
    });
  });

  it('rejects with AMOUNT_MISMATCH when extracted amount does not match order total', async () => {
    const mockPrisma = createMockPrisma();
    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: 300000, // 3000 CRC vs 5000 CRC
        currency: 'CRC',
        referenceNumber: 'SINPE-123456',
        recipientPhone: '+50688887777',
        recipientName: 'Panadería La Esquina',
        senderName: null,
        transactionDate: '2026-10-17T11:45:00.000Z',
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia por ₡3.000',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('receipt'),
      'image/jpeg',
    );

    expect(result.status).toBe('AMOUNT_MISMATCH');
    expect(result.autoApproved).toBe(false);
    expect(result.rejectionReason).toContain('does not match order total');
    expect(mockPrisma._tx.order.update).not.toHaveBeenCalled();
    expect(mockPrisma._tx.orderStatusEvent.create).not.toHaveBeenCalled();
  });

  it('rejects with DUPLICATE_REFERENCE when reference was already matched on another order', async () => {
    const mockPrisma = createMockPrisma();
    mockPrisma.receiptVerification.findFirst.mockResolvedValueOnce({
      id: 'existing_verif',
      referenceNumber: 'SINPE-998877',
      status: 'MATCHED',
      receipt: {
        order: { code: 'ORD-PREV-88' },
      },
    });

    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: 500000,
        currency: 'CRC',
        referenceNumber: 'SINPE-998877',
        recipientPhone: '+50688887777',
        recipientName: 'Panadería La Esquina',
        senderName: null,
        transactionDate: '2026-10-17T11:45:00.000Z',
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia por ₡5.000',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('receipt'),
      'image/jpeg',
    );

    expect(result.status).toBe('DUPLICATE_REFERENCE');
    expect(result.autoApproved).toBe(false);
    expect(result.rejectionReason).toContain('was already used on order ORD-PREV-88');
    expect(mockPrisma._tx.order.update).not.toHaveBeenCalled();
  });

  it('rejects with RECIPIENT_MISMATCH when recipient phone does not match store phone', async () => {
    const mockPrisma = createMockPrisma();
    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: 500000,
        currency: 'CRC',
        referenceNumber: 'SINPE-123456',
        recipientPhone: '+50611112222', // Completely different destination phone
        recipientName: 'Persona Desconocida',
        senderName: null,
        transactionDate: '2026-10-17T11:45:00.000Z',
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia por ₡5.000',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('receipt'),
      'image/jpeg',
    );

    expect(result.status).toBe('RECIPIENT_MISMATCH');
    expect(result.autoApproved).toBe(false);
    expect(result.rejectionReason).toContain('does not match store phone');
    expect(mockPrisma._tx.order.update).not.toHaveBeenCalled();
  });

  it('marks UNVERIFIED when transaction date is older than 48 hours', async () => {
    const mockPrisma = createMockPrisma();
    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: 500000,
        currency: 'CRC',
        referenceNumber: 'SINPE-OLD-999',
        recipientPhone: '+50688887777',
        recipientName: 'Panadería La Esquina',
        senderName: null,
        transactionDate: '2026-10-10T12:00:00.000Z', // 7 days ago
        bankName: 'BAC Credomatic',
        confidence: 'HIGH',
        rawSummary: 'Transferencia antigua',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('receipt'),
      'image/jpeg',
    );

    expect(result.status).toBe('UNVERIFIED');
    expect(result.autoApproved).toBe(false);
    expect(result.rejectionReason).toContain('older than 48 hours');
    expect(mockPrisma._tx.order.update).not.toHaveBeenCalled();
  });

  it('marks UNVERIFIED when image is low confidence or blurry', async () => {
    const mockPrisma = createMockPrisma();
    const mockExtractor: Partial<ReceiptExtractorService> = {
      extractReceipt: jest.fn().mockResolvedValue({
        amountMinor: null,
        currency: null,
        referenceNumber: null,
        recipientPhone: null,
        recipientName: null,
        senderName: null,
        transactionDate: null,
        bankName: null,
        confidence: 'LOW',
        rawSummary: 'Imagen no legible',
      }),
    };

    const service = new ReceiptVerificationService(
      mockPrisma as unknown as PrismaService,
      mockExtractor as ReceiptExtractorService,
    );

    const result = await service.verifyReceipt(
      'order_1',
      'receipt_1',
      Buffer.from('blurry-pic'),
      'image/jpeg',
    );

    expect(result.status).toBe('UNVERIFIED');
    expect(result.autoApproved).toBe(false);
    expect(mockPrisma._tx.order.update).not.toHaveBeenCalled();
  });
});
