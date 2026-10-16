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
  type CreatePaymentMethodInput,
  createPaymentMethodSchema,
  type PaymentMethod,
  type ReorderInput,
  reorderSchema,
  type UpdatePaymentMethodInput,
  updatePaymentMethodSchema,
} from '@booth/shared';

import { PaymentMethodsService } from './payment-methods.service';
import { CurrentStore } from '../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('me/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly methods: PaymentMethodsService) {}

  @Get()
  @ApiOperation({ summary: 'Transfer methods in display order (cash is a store setting)' })
  list(@CurrentStore() storeId: string): Promise<PaymentMethod[]> {
    return this.methods.list(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a transfer method from a preset or fully custom' })
  @ApiZodBody(createPaymentMethodSchema)
  create(
    @CurrentStore() storeId: string,
    @ZodBody(createPaymentMethodSchema) body: CreatePaymentMethodInput,
  ): Promise<PaymentMethod> {
    return this.methods.create(storeId, body);
  }

  @Put('order')
  @ApiZodBody(reorderSchema)
  reorder(
    @CurrentStore() storeId: string,
    @ZodBody(reorderSchema) body: ReorderInput,
  ): Promise<PaymentMethod[]> {
    return this.methods.reorder(storeId, body.ids);
  }

  @Patch(':id')
  @ApiZodBody(updatePaymentMethodSchema)
  update(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updatePaymentMethodSchema) body: UpdatePaymentMethodInput,
  ): Promise<PaymentMethod> {
    return this.methods.update(storeId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentStore() storeId: string, @Param('id') id: string): Promise<void> {
    return this.methods.remove(storeId, id);
  }
}
