import { Module } from '@nestjs/common';

import { ReceiptExtractorService } from './receipt-extractor.service';

@Module({
  providers: [ReceiptExtractorService],
  exports: [ReceiptExtractorService],
})
export class ReceiptsModule {}
