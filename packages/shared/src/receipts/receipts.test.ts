import { describe, expect, it } from 'vitest';

import {
  receiptConfidenceSchema,
  receiptExtractionSchema,
  receiptVerificationResultSchema,
  receiptVerificationStatusSchema,
} from './schema';

describe('receipt schemas', () => {
  it('validates a complete extraction result', () => {
    const valid = receiptExtractionSchema.parse({
      amountMinor: 520000,
      currency: 'CRC',
      recipientPhone: '+50688887777',
      recipientName: 'Panadería La Esquina',
      senderName: 'Juan Pérez',
      transactionDate: '2026-10-17T19:04:12Z',
      referenceNumber: '104928374',
      bankName: 'BAC Credomatic',
      confidence: 'HIGH',
      rawSummary: 'Transferencia SINPE Móvil por ₡5.200 a Panadería La Esquina',
    });

    expect(valid.amountMinor).toBe(520000);
    expect(valid.confidence).toBe('HIGH');
  });

  it('allows nullable fields for partial or blurry receipts', () => {
    const partial = receiptExtractionSchema.parse({
      amountMinor: null,
      currency: null,
      recipientPhone: null,
      recipientName: null,
      senderName: null,
      transactionDate: null,
      referenceNumber: null,
      bankName: null,
      confidence: 'LOW',
      rawSummary: null,
    });

    expect(partial.confidence).toBe('LOW');
    expect(partial.amountMinor).toBeNull();
  });

  it('rejects negative amounts or floating point numbers', () => {
    expect(() =>
      receiptExtractionSchema.parse({
        amountMinor: -100,
        currency: 'CRC',
        recipientPhone: null,
        recipientName: null,
        senderName: null,
        transactionDate: null,
        referenceNumber: null,
        bankName: null,
        confidence: 'MEDIUM',
        rawSummary: null,
      }),
    ).toThrow();

    expect(() =>
      receiptExtractionSchema.parse({
        amountMinor: 52.5,
        currency: 'CRC',
        recipientPhone: null,
        recipientName: null,
        senderName: null,
        transactionDate: null,
        referenceNumber: null,
        bankName: null,
        confidence: 'MEDIUM',
        rawSummary: null,
      }),
    ).toThrow();
  });

  it('validates verification statuses and results', () => {
    expect(receiptVerificationStatusSchema.parse('MATCHED')).toBe('MATCHED');
    expect(receiptVerificationStatusSchema.parse('AMOUNT_MISMATCH')).toBe('AMOUNT_MISMATCH');
    expect(receiptVerificationStatusSchema.parse('DUPLICATE_REFERENCE')).toBe(
      'DUPLICATE_REFERENCE',
    );
    expect(receiptConfidenceSchema.parse('HIGH')).toBe('HIGH');

    const result = receiptVerificationResultSchema.parse({
      status: 'MATCHED',
      confidence: 'HIGH',
      extracted: {
        amountMinor: 5000,
        currency: 'CRC',
        recipientPhone: '88887777',
        recipientName: 'La Esquina',
        senderName: null,
        transactionDate: null,
        referenceNumber: 'REF12345',
        bankName: 'BCR',
        confidence: 'HIGH',
        rawSummary: 'Comprobante válido',
      },
      mismatchReason: null,
      verifiedAt: '2026-10-17T19:15:00Z',
    });

    expect(result.status).toBe('MATCHED');
  });
});
