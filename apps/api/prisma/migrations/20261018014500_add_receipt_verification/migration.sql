-- CreateEnum
CREATE TYPE "ReceiptVerificationStatus" AS ENUM ('MATCHED', 'AMOUNT_MISMATCH', 'RECIPIENT_MISMATCH', 'DUPLICATE_REFERENCE', 'UNVERIFIED');

-- CreateTable
CREATE TABLE "ReceiptVerification" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "status" "ReceiptVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "confidence" TEXT NOT NULL DEFAULT 'LOW',
    "extractedAmountMinor" BIGINT,
    "extractedCurrency" TEXT,
    "referenceNumber" TEXT,
    "recipientPhone" TEXT,
    "recipientName" TEXT,
    "senderName" TEXT,
    "transactionDate" TEXT,
    "bankName" TEXT,
    "rawSummary" TEXT,
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptVerification_receiptId_key" ON "ReceiptVerification"("receiptId");

-- CreateIndex
CREATE INDEX "ReceiptVerification_storeId_referenceNumber_idx" ON "ReceiptVerification"("storeId", "referenceNumber");

-- CreateIndex
CREATE INDEX "ReceiptVerification_storeId_status_idx" ON "ReceiptVerification"("storeId", "status");

-- Partial unique index: ensures referenceNumber is unique per store among approved/matched receipts
CREATE UNIQUE INDEX "ReceiptVerification_storeId_referenceNumber_matched_key"
ON "ReceiptVerification"("storeId", "referenceNumber")
WHERE "status" = 'MATCHED' AND "referenceNumber" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "ReceiptVerification" ADD CONSTRAINT "ReceiptVerification_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVerification" ADD CONSTRAINT "ReceiptVerification_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
