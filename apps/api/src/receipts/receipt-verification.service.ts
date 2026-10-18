import { Injectable, Logger } from '@nestjs/common';

import { type ReceiptExtractionResult, type ReceiptVerificationStatus } from '@booth/shared';

import { ReceiptExtractorService } from './receipt-extractor.service';
import { type ReceiptVerification } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface VerifyReceiptResult {
  status: ReceiptVerificationStatus;
  rejectionReason: string | null;
  autoApproved: boolean;
  verification: ReceiptVerification;
}

const MAX_RECEIPT_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

@Injectable()
export class ReceiptVerificationService {
  private readonly logger = new Logger(ReceiptVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: ReceiptExtractorService,
  ) {}

  /**
   * Verifies an uploaded payment receipt for an order using AI extraction and fraud guards:
   * 1. Extracts metadata via ReceiptExtractorService (Gemini Vision).
   * 2. Validates amount and currency match order totals exactly.
   * 3. Checks recipient phone against store phone when detectable.
   * 4. Checks against duplicate reference numbers previously used on approved orders.
   * 5. Checks date recency (transaction within last 48 hours).
   * 6. Automatically transitions paymentStatus to PAID when verification passes.
   */
  async verifyReceipt(
    orderId: string,
    receiptId: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<VerifyReceiptResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { select: { id: true, whatsappPhone: true, name: true } },
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    let extracted: ReceiptExtractionResult | null = null;
    try {
      extracted = await this.extractor.extractReceipt(fileBuffer, mimeType);
    } catch (err) {
      this.logger.warn(`AI extraction threw: ${err instanceof Error ? err.message : String(err)}`);
    }

    let status: ReceiptVerificationStatus | null = null;
    let rejectionReason: string | null = null;
    let autoApproved = false;

    if (!extracted) {
      status = 'UNVERIFIED';
      rejectionReason = 'AI extraction returned no result or is not configured';
    } else if (
      extracted.confidence === 'LOW' &&
      (extracted.amountMinor === null || !extracted.referenceNumber)
    ) {
      status = 'UNVERIFIED';
      rejectionReason = 'Receipt image is blurry or missing key transaction details';
    } else {
      // 1. Amount and currency check
      if (extracted.amountMinor === null) {
        status = 'UNVERIFIED';
        rejectionReason = 'Transaction amount could not be detected';
      } else if (BigInt(extracted.amountMinor) !== order.totalMinor) {
        status = 'AMOUNT_MISMATCH';
        rejectionReason = `Extracted amount (${extracted.amountMinor}) does not match order total (${order.totalMinor.toString()})`;
      } else if (
        extracted.currency &&
        extracted.currency.toUpperCase() !== order.currency.toUpperCase()
      ) {
        status = 'AMOUNT_MISMATCH';
        rejectionReason = `Extracted currency ${extracted.currency} does not match order currency ${order.currency}`;
      }

      // 2. Recipient phone check (if present on receipt)
      if (!status && extracted.recipientPhone) {
        const cleanRecipient = extracted.recipientPhone.replace(/\D/g, '');
        const cleanStore = order.store.whatsappPhone.replace(/\D/g, '');
        if (
          cleanRecipient.length >= 8 &&
          cleanStore.length >= 8 &&
          !cleanStore.endsWith(cleanRecipient) &&
          !cleanRecipient.endsWith(cleanStore)
        ) {
          status = 'RECIPIENT_MISMATCH';
          rejectionReason = `Recipient phone ${extracted.recipientPhone} does not match store phone ${order.store.whatsappPhone}`;
        }
      }

      // 3. Duplicate reference check (against previously MATCHED receipts in this store)
      if (!status) {
        if (extracted.referenceNumber) {
          const duplicate = await this.prisma.receiptVerification.findFirst({
            where: {
              storeId: order.storeId,
              referenceNumber: extracted.referenceNumber,
              status: 'MATCHED',
              receipt: { orderId: { not: order.id } },
            },
            include: {
              receipt: { select: { order: { select: { code: true } } } },
            },
          });

          if (duplicate) {
            status = 'DUPLICATE_REFERENCE';
            rejectionReason = `Reference ${extracted.referenceNumber} was already used on order ${duplicate.receipt.order.code}`;
          }
        } else {
          status = 'UNVERIFIED';
          rejectionReason = 'No transaction reference number detected on receipt';
        }
      }

      // 4. Date recency check and approval decision
      if (!status) {
        if (extracted.transactionDate) {
          const txDate = new Date(extracted.transactionDate);
          if (!Number.isNaN(txDate.getTime())) {
            const ageMs = order.createdAt.getTime() - txDate.getTime();
            if (ageMs > MAX_RECEIPT_AGE_MS) {
              status = 'UNVERIFIED';
              rejectionReason = 'Transaction date is older than 48 hours from order creation';
            }
          }
        }
      }

      // If all verification checks passed:
      if (!status) {
        status = 'MATCHED';
        autoApproved = true;
      }
    }

    const verification = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.receiptVerification.upsert({
        where: { receiptId },
        create: {
          receiptId,
          storeId: order.storeId,
          status,
          confidence: extracted?.confidence ?? 'LOW',
          extractedAmountMinor:
            extracted?.amountMinor !== null && extracted?.amountMinor !== undefined
              ? BigInt(extracted.amountMinor)
              : null,
          extractedCurrency: extracted?.currency ?? null,
          referenceNumber: extracted?.referenceNumber ?? null,
          recipientPhone: extracted?.recipientPhone ?? null,
          recipientName: extracted?.recipientName ?? null,
          senderName: extracted?.senderName ?? null,
          transactionDate: extracted?.transactionDate ?? null,
          bankName: extracted?.bankName ?? null,
          rawSummary: extracted?.rawSummary ?? null,
          rejectionReason,
          verifiedAt: new Date(),
        },
        update: {
          status,
          confidence: extracted?.confidence ?? 'LOW',
          extractedAmountMinor:
            extracted?.amountMinor !== null && extracted?.amountMinor !== undefined
              ? BigInt(extracted.amountMinor)
              : null,
          extractedCurrency: extracted?.currency ?? null,
          referenceNumber: extracted?.referenceNumber ?? null,
          recipientPhone: extracted?.recipientPhone ?? null,
          recipientName: extracted?.recipientName ?? null,
          senderName: extracted?.senderName ?? null,
          transactionDate: extracted?.transactionDate ?? null,
          bankName: extracted?.bankName ?? null,
          rawSummary: extracted?.rawSummary ?? null,
          rejectionReason,
          verifiedAt: new Date(),
        },
      });

      if (autoApproved) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            expiresAt: null,
          },
        });

        await tx.orderStatusEvent.create({
          data: {
            orderId: order.id,
            status: order.status,
            actor: 'system',
            note: `Payment verified automatically via AI (Ref: ${extracted?.referenceNumber ?? 'N/A'})`,
          },
        });
      }

      return saved;
    });

    return {
      status,
      rejectionReason,
      autoApproved,
      verification,
    };
  }
}
