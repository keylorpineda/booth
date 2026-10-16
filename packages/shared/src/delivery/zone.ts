import { z } from 'zod';

import { minorUnitsSchema } from '../money/schemas';

const zoneFields = z.object({
  name: z.string().trim().min(1).max(60),
  /** Delivery fee in minor units of the store currency. */
  feeMinor: minorUnitsSchema,
  isActive: z.boolean(),
});

export const createDeliveryZoneSchema = zoneFields.extend({ isActive: z.boolean().default(true) });
export const updateDeliveryZoneSchema = zoneFields.partial();

export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>;
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>;

export const deliveryZoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  feeMinor: z.number().int(),
  isActive: z.boolean(),
  position: z.number().int(),
});

export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;
