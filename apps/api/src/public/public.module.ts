import { Module } from '@nestjs/common';

import { PublicOrdersController } from './public-orders.controller';
import { PublicStoreService } from './public-store.service';
import { PublicStoresController } from './public-stores.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PublicStoresController, PublicOrdersController],
  providers: [PublicStoreService],
})
export class PublicModule {}
