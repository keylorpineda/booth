import { z } from 'zod';

/**
 * ISO 4217 minor-unit exponents that differ from the default of 2.
 * Source: ISO 4217 list one. CLDR (used by Intl) disagrees for a few codes, so ISO wins here.
 */
const NON_DEFAULT_EXPONENTS: Readonly<Record<string, number>> = {
  // 0 decimals
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  // 3 decimals
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  // 4 decimals
  CLF: 4,
  UYW: 4,
};

const DEFAULT_EXPONENT = 2;

let supportedCurrencies: ReadonlySet<string> | undefined;

/** All currency codes the runtime can format (from `Intl.supportedValuesOf`). */
export function getSupportedCurrencies(): ReadonlySet<string> {
  supportedCurrencies ??= new Set(Intl.supportedValuesOf('currency'));
  return supportedCurrencies;
}

export function isSupportedCurrency(code: string): boolean {
  return getSupportedCurrencies().has(code);
}

/** Number of minor-unit digits for a currency (e.g. 2 for CRC and USD, 0 for CLP, 3 for KWD). */
export function getCurrencyExponent(currency: string): number {
  return NON_DEFAULT_EXPONENTS[currency] ?? DEFAULT_EXPONENT;
}

export const currencyCodeSchema = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Must be an ISO 4217 code')
  .refine(isSupportedCurrency, 'Unsupported currency');

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
