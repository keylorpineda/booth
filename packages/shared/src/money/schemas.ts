import { z } from 'zod';

import { isSupportedCurrency } from './currencies';

export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 code')
  .refine(isSupportedCurrency, 'Unsupported currency');

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export const minorUnitsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER, 'Amount too large');
