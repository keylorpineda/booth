import { type ZodType } from 'zod';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

/** An error answered by the API in its standard format, or a network failure (status 0). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions<T> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /**
   * Validates the response so a contract change fails loudly. Optional on purpose: first-load
   * storefront requests skip it to keep Zod out of the critical bundle (the API's contract tests
   * guard those shapes); checkout and tracking validate.
   */
  schema?: ZodType<T>;
  signal?: AbortSignal;
}

export async function api<T>(
  path: string,
  { method = 'GET', body, schema, signal }: RequestOptions<T> = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: signal ?? null,
      credentials: 'include',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? null : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw toApiError(response.status, payload);
  return schema ? schema.parse(payload) : (payload as T);
}

/** Reads the standard error body `{ error: { code, message, details?, requestId } }`. */
export function toApiError(status: number, payload: unknown): ApiError {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
  if (!error || typeof error.code !== 'string' || typeof error.message !== 'string') {
    return new ApiError(status, 'INTERNAL_ERROR', 'Unexpected response');
  }
  return new ApiError(
    status,
    error.code,
    error.message,
    isRecord(error.details) ? error.details : undefined,
    typeof error.requestId === 'string' ? error.requestId : undefined,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
