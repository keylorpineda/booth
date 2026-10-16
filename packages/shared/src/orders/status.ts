import { z } from 'zod';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const paymentStatusSchema = z.enum(['UNPAID', 'RECEIPT_SUBMITTED', 'PAID']);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const fulfillmentSchema = z.enum(['PICKUP', 'DELIVERY']);
export type Fulfillment = z.infer<typeof fulfillmentSchema>;
