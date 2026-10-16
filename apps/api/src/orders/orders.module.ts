import { Module } from '@nestjs/common';

import { ExpireOrdersJob } from './jobs/expire-orders.job';
import { InternalJobsController } from './jobs/internal-jobs.controller';
import { OrderCreationService } from './order-creation.service';
import { OrderExpirationService } from './order-expiration.service';
import { OrderPricingService } from './order-pricing.service';
import { OrderQuoteService } from './order-quote.service';
import { StockService } from './stock.service';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [InternalJobsController],
  providers: [
    StockService,
    OrderPricingService,
    OrderExpirationService,
    OrderQuoteService,
    OrderCreationService,
    TrackingService,
    ExpireOrdersJob,
  ],
  exports: [OrderQuoteService, OrderCreationService, TrackingService, OrderExpirationService],
})
export class OrdersModule {}
