import { Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import {
  type CreateOrderInput,
  createOrderSchema,
  type OrderCreated,
  type PublicCatalog,
  type PublicStore,
  type Quote,
  type QuoteRequest,
  quoteRequestSchema,
} from '@booth/shared';

import { PublicStoreService } from './public-store.service';
import { Public } from '../auth/decorators/public.decorator';
import { RateLimit } from '../common/rate-limit/rate-limit.decorator';
import { ApiZodBody, ZodBody } from '../common/validation/zod.decorators';
import { OrderCreationService } from '../orders/order-creation.service';
import { OrderQuoteService } from '../orders/order-quote.service';
import { CurrentTenant } from '../tenancy/current-tenant.decorator';
import { type Tenant } from '../tenancy/tenant-resolver';
import { TenantGuard } from '../tenancy/tenant.guard';

@ApiTags('storefront')
@ApiParam({ name: 'slug', example: 'panaderia-la-esquina' })
@Public()
@UseGuards(TenantGuard)
@Controller('public/stores/:slug')
export class PublicStoresController {
  constructor(
    private readonly stores: PublicStoreService,
    private readonly quotes: OrderQuoteService,
    private readonly orders: OrderCreationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Store info, open status, fulfillment, payment methods, privacy notice',
  })
  getStore(@CurrentTenant() tenant: Tenant): Promise<PublicStore> {
    return this.stores.getStore(tenant.storeId);
  }

  @Get('catalog')
  @ApiOperation({ summary: 'Active categories and products with availability' })
  getCatalog(@CurrentTenant() tenant: Tenant): Promise<PublicCatalog> {
    return this.stores.getCatalog(tenant.storeId);
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Server-computed totals for a cart (no side effects)' })
  @ApiZodBody(quoteRequestSchema)
  quote(
    @CurrentTenant() tenant: Tenant,
    @ZodBody(quoteRequestSchema) body: QuoteRequest,
  ): Promise<Quote> {
    return this.quotes.quote(tenant.storeId, body);
  }

  @Post('orders')
  @RateLimit('public-orders')
  @ApiOperation({
    summary: 'Place an order: saved as PENDING with stock reserved, returns the WhatsApp link',
  })
  @ApiZodBody(createOrderSchema)
  createOrder(
    @CurrentTenant() tenant: Tenant,
    @ZodBody(createOrderSchema) body: CreateOrderInput,
  ): Promise<OrderCreated> {
    return this.orders.create(tenant.storeId, body);
  }
}
