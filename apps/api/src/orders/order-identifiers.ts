import { randomBytes, randomInt } from 'node:crypto';

/** Crockford base32 without I, L, O, U: easy to read aloud and type as a payment reference. */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ORDER_CODE_LENGTH = 6;

/** Short human code, unique per store. Used as the payment reference, never for access. */
export function generateOrderCode(): string {
  return Array.from({ length: ORDER_CODE_LENGTH }, () => CODE_ALPHABET[randomInt(32)]).join('');
}

/** Unguessable tracking token: 256 random bits, URL-safe. */
export function generateTrackingToken(): string {
  return randomBytes(32).toString('base64url');
}
