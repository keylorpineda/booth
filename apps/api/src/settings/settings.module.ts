import { Module } from '@nestjs/common';

import { BusinessHoursController } from './business-hours.controller';
import { BusinessHoursService } from './business-hours.service';
import { DeliveryZonesController } from './delivery-zones.controller';
import { DeliveryZonesService } from './delivery-zones.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';

/** Owner settings for selling: transfer methods, delivery zones and opening hours. */
@Module({
  controllers: [PaymentMethodsController, DeliveryZonesController, BusinessHoursController],
  providers: [PaymentMethodsService, DeliveryZonesService, BusinessHoursService],
})
export class SettingsModule {}
