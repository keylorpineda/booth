import {
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';
import { z } from 'zod';

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Normalizes user input to E.164 ("+50688887777").
 * Numbers without a "+" prefix are read as local numbers of `defaultCountry`.
 * Returns null when the number is not valid.
 */
export function toE164(input: string, defaultCountry?: string): string | null {
  const country = defaultCountry && isSupportedCountry(defaultCountry) ? defaultCountry : undefined;
  const phone = parsePhoneNumberFromString(input, country);
  return phone?.isValid() ? phone.number : null;
}

export function isValidE164(value: string): boolean {
  return E164_PATTERN.test(value) && toE164(value) === value;
}

/** Calling code without "+" for an ISO 3166-1 alpha-2 country ("CR" -> "506"). */
export function getCallingCode(country: string): string | null {
  return isSupportedCountry(country) ? getCountryCallingCode(country) : null;
}

/** Digits only, as required by `https://wa.me/<phone>` links. */
export function toWhatsAppNumber(e164: string): string {
  return e164.replace(/^\+/, '');
}

/** Validates an E.164 phone number (any country). */
export const e164PhoneSchema = z.string().trim().refine(isValidE164, 'Invalid phone number');
