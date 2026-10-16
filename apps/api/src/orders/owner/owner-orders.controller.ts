import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  type OwnerOrder,
  type OwnerOrderListQuery,
  ownerOrderListQuerySchema,
  type OwnerOrderSummary,
  type Paginated,
  type ReceiptUrl,
  type UpdateOrderStatusInput,
  updateOrderStatusSchema,
  type UpdatePaymentStatusInput,
  updatePaymentStatusSchema,
} from '@booth/shared';

import { OrderActionsService } from './order-actions.service';
import { OwnerOrdersService } from './owner-orders.service';
import { CurrentStore } from '../../auth/decorators/current-store.decorator';
import { ApiZodBody, ZodBody, ZodQuery } from '../../common/validation/zod.decorators';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('me/orders')
export class OwnerOrdersController {
  constructor(
    private readonly orders: OwnerOrdersService,
    private readonly actions: OrderActionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Orders, newest first; filters by status, payment, dates and search' })
  list(
    @CurrentStore() storeId: string,
    @ZodQuery(ownerOrderListQuerySchema) query: OwnerOrderListQuery,
  ): Promise<Paginated<OwnerOrderSummary>> {
    return this.orders.list(storeId, query);
  }

  @Get(':id')
  get(@CurrentStore() storeId: string, @Param('id') id: string): Promise<OwnerOrder> {
    return this.orders.get(storeId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Move the order along its status flow; cancelling releases stock' })
  @ApiZodBody(updateOrderStatusSchema)
  changeStatus(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updateOrderStatusSchema) body: UpdateOrderStatusInput,
  ): Promise<OwnerOrder> {
    return this.actions.changeStatus(storeId, id, body);
  }

  @Patch(':id/payment')
  @ApiOperation({ summary: 'Mark the payment as PAID (stops expiry) or back to UNPAID' })
  @ApiZodBody(updatePaymentStatusSchema)
  changePayment(
    @CurrentStore() storeId: string,
    @Param('id') id: string,
    @ZodBody(updatePaymentStatusSchema) body: UpdatePaymentStatusInput,
  ): Promise<OwnerOrder> {
    return this.actions.changePayment(storeId, id, body);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bring an expired order back if its stock is still available' })
  reactivate(@CurrentStore() storeId: string, @Param('id') id: string): Promise<OwnerOrder> {
    return this.actions.reactivate(storeId, id);
  }

  @Get(':id/receipt-url')
  @ApiOperation({ summary: 'Short-lived signed URL to view the payment receipt' })
  receiptUrl(@CurrentStore() storeId: string, @Param('id') id: string): Promise<ReceiptUrl> {
    return this.actions.receiptUrl(storeId, id);
  }
}
