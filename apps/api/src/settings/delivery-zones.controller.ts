import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type CreateDeliveryZoneInput,
  createDeliveryZoneSchema,
  type DeliveryZone,
  type ReorderInput,
  reorderSchema,
  type UpdateDeliveryZoneInput,
  updateDeliveryZoneSchema,
} from '@booth/shared';

import { DeliveryZonesService } from './delivery-zones.service';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('me/delivery-zones')
export class DeliveryZonesController {
  constructor(private readonly zones: DeliveryZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Delivery zones in display order' })
  list(@CurrentStore() storeId: string): Promise<DeliveryZone[]> {
    return this.zones.list(storeId);
  }

  @Post()
  @ApiZodBody(createDeliveryZoneSchema)
  create(
    @CurrentStore() storeId: string,
    @ZodBody(createDeliveryZoneSchema) body: CreateDeliveryZoneInput,
  ): Promise<DeliveryZone> {
    return this.zones.create(storeId, body);
  }

  @Put('order')
  @ApiZodBody(reorderSchema)
  reorder(
    @CurrentStore() storeId: string,
    @ZodBody(reorderSchema) body: ReorderInput,
  ): Promise<DeliveryZone[]> {
    return this.zones.reorder(storeId, body.ids);
  }

  @Patch(':id')
  @ApiZodBody(updateDeliveryZoneSchema)
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updateDeliveryZoneSchema) body: UpdateDeliveryZoneInput,
  ): Promise<DeliveryZone> {
    return this.zones.update(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    return this.zones.remove(storeId, id);
  }
}
