import { Controller, Get, HttpCode, HttpStatus, Param, Post, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { type Tracking } from '@booth/shared';

import { Public } from '../auth/decorators/public.decorator';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { assertReceiptFile } from '../media/image-file';
import { ImageUpload } from '../media/image-upload.decorator';
import { TrackingService } from '../orders/tracking.service';

@ApiTags('storefront')
@Public()
@Controller('public/orders/:token')
export class PublicOrdersController {
  constructor(private readonly tracking: TrackingService) {}

  @Get()
  @ApiOperation({ summary: 'Order tracking by the unguessable token' })
  get(@Param('token') token: string): Promise<Tracking> {
    return this.tracking.get(token);
  }

  @Post('receipt')
  @HttpCode(HttpStatus.OK)
  @RateLimit('public-orders')
  @ImageUpload()
  @ApiOperation({
    summary: 'Upload a payment receipt (JPEG, PNG, WebP, HEIC or PDF, max 5 MB); pauses expiration',
  })
  uploadReceipt(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<Tracking> {
    const { buffer, format } = assertReceiptFile(file);
    return this.tracking.uploadReceipt(token, buffer, format);
  }
}
