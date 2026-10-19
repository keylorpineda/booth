import { Module } from '@nestjs/common';

import { ReceiptExtractorService } from './receipt-extractor.service';
import { ReceiptVerificationService } from './receipt-verification.service';

@Module({
  providers: [ReceiptExtractorService, ReceiptVerificationService],
  exports: [ReceiptExtractorService, ReceiptVerificationService],
})
export class ReceiptsModule {}
