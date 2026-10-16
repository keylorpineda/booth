/** Machine-readable error codes. The web app maps each code to a localized message. */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
  // Auth
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_REUSED',
  'DEMO_READ_ONLY',
  // Stores
  'ONBOARDING_REQUIRED',
  'STORE_ALREADY_EXISTS',
  'SLUG_TAKEN',
  // Catalog and media
  'CATEGORY_NAME_TAKEN',
  'TOO_MANY_IMAGES',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_FILE_TYPE',
  'MEDIA_NOT_CONFIGURED',
  // Orders
  'STORE_CLOSED',
  'PRODUCT_UNAVAILABLE',
  'OUT_OF_STOCK',
  'ORDER_NOT_PAYABLE',
  'INVALID_STATUS_TRANSITION',
  // Settings
  'CURRENCY_LOCKED',
  'ZONE_NAME_TAKEN',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export interface FieldError {
  path: string;
  message: string;
}

/** Shape of every error response: `{ error: { code, message, details?, requestId } }`. */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | undefined;
    requestId: string;
  };
}
