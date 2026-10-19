import { z } from 'zod';

export const receiptVerificationStatusSchema = z.enum([
  'MATCHED',
  'AMOUNT_MISMATCH',
  'RECIPIENT_MISMATCH',
  'DUPLICATE_REFERENCE',
  'UNVERIFIED',
]);

export type ReceiptVerificationStatus = z.infer<typeof receiptVerificationStatusSchema>;

export const receiptConfidenceSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type ReceiptConfidence = z.infer<typeof receiptConfidenceSchema>;

export const receiptExtractionSchema = z.object({
  amountMinor: z.number().int().nonnegative().nullable(),
  currency: z.string().nullable(),
  recipientPhone: z.string().nullable(),
  recipientName: z.string().nullable(),
  senderName: z.string().nullable(),
  transactionDate: z.string().nullable(),
  referenceNumber: z.string().nullable(),
  bankName: z.string().nullable(),
  confidence: receiptConfidenceSchema,
  rawSummary: z.string().nullable(),
});

export type ReceiptExtractionResult = z.infer<typeof receiptExtractionSchema>;

export const receiptVerificationResultSchema = z.object({
  status: receiptVerificationStatusSchema,
  confidence: receiptConfidenceSchema,
  extracted: receiptExtractionSchema,
  mismatchReason: z.string().nullable(),
  verifiedAt: z.string(),
});

export type ReceiptVerificationResult = z.infer<typeof receiptVerificationResultSchema>;
