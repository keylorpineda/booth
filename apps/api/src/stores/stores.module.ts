import { Module } from '@nestjs/common';

import { StoreBrandingService } from './store-branding.service';
import { StorePresenter } from './store-presenter.service';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  controllers: [StoresController],
  providers: [StoresService, StoreBrandingService, StorePresenter],
})
export class StoresModule {}
