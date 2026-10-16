import { z } from 'zod';

import { type BusinessHour } from './hours';

export const businessHourSchema: z.ZodType<BusinessHour> = z
  .object({
    weekday: z.number().int().min(0).max(6), // 0 = Sunday
    opensAtMin: z.number().int().min(0).max(1439),
    closesAtMin: z.number().int().min(1).max(1440),
  })
  .refine((h) => h.closesAtMin > h.opensAtMin, 'Closing time must be after opening time');
