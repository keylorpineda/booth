import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { OrderExpirationService } from '../order-expiration.service';

/** In-process schedule. The free instance sleeps, so lazy expiry and an external cron back it up. */
@Injectable()
export class ExpireOrdersJob {
  constructor(private readonly expiration: OrderExpirationService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'expire-orders' })
  async run(): Promise<void> {
    await this.expiration.expireStale();
  }
}
