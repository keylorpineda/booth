import { z } from 'zod';

import { type BusinessHour } from './hours';

export const businessHourSchema: z.ZodType<BusinessHour> = z
  .object({
    weekday: z.number().int().min(0).max(6), // 0 = Sunday
    opensAtMin: z.number().int().min(0).max(1439),
    closesAtMin: z.number().int().min(1).max(1440),
  })
  .refine((h) => h.closesAtMin > h.opensAtMin, 'Closing time must be after opening time');

/** The whole week at once (replace semantics). Intervals of the same day may not overlap. */
export const weeklyHoursSchema = z.object({
  hours: z
    .array(businessHourSchema)
    .max(28)
    .superRefine((hours, ctx) => {
      for (let day = 0; day <= 6; day++) {
        const intervals = hours
          .map((h, index) => ({ ...h, index }))
          .filter((h) => h.weekday === day)
          .sort((a, b) => a.opensAtMin - b.opensAtMin);
        for (let i = 1; i < intervals.length; i++) {
          const previous = intervals[i - 1];
          const current = intervals[i];
          if (previous && current && current.opensAtMin < previous.closesAtMin) {
            ctx.addIssue({ code: 'custom', path: [current.index], message: 'Overlapping hours' });
          }
        }
      }
    }),
});

export type WeeklyHoursInput = z.infer<typeof weeklyHoursSchema>;
