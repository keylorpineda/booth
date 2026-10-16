import { Module } from '@nestjs/common';

import { ExpireOrdersJob } from './jobs/expire-orders.job';
import { InternalJobsController } from './jobs/internal-jobs.controller';
import { OrderCreationService } from './order-creation.service';
import { OrderExpirationService } from './order-expiration.service';
import { OrderPricingService } from './order-pricing.service';
import { OrderQuoteService } from './order-quote.service';
import { OrderActionsService } from './owner/order-actions.service';
import { OwnerOrdersController } from './owner/owner-orders.controller';
import { OwnerOrdersService } from './owner/owner-orders.service';
import { StockService } from './stock.service';
import { TrackingService } from './tracking.service';

@Module({
  controllers: [InternalJobsController, OwnerOrdersController],
  providers: [
    StockService,
    OrderPricingService,
    OrderExpirationService,
    OrderQuoteService,
    OrderCreationService,
    TrackingService,
    ExpireOrdersJob,
    OwnerOrdersService,
    OrderActionsService,
  ],
  exports: [OrderQuoteService, OrderCreationService, TrackingService, OrderExpirationService],
})
export class OrdersModule {}
