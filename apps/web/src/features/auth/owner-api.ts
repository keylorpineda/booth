import { refreshSession } from './session';
import { useSessionStore } from './session-store';
import { api, ApiError, type RequestOptions } from '../../lib/api-client';

const isExpiredToken = (error: unknown) =>
  error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHENTICATED';

/**
 * API call as the signed-in owner. On an expired access token it refreshes once (shared with any
 * other caller) and retries; when the refresh fails the session ends and the error propagates.
 */
export async function ownerApi<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const attempt = () => {
    const token = useSessionStore.getState().accessToken;
    return api<T>(path, {
      ...options,
      headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  };

  try {
    return await attempt();
  } catch (error) {
    if (isExpiredToken(error) && (await refreshSession())) return attempt();
    throw error;
  }
}
