import { type ZodType } from 'zod';

import { refreshSession } from './session';
import { useSessionStore } from './session-store';
import { ApiError } from '../../lib/api-client';
import { uploadFile } from '../../lib/upload';

/** Upload as the signed-in owner; like `ownerApi`, refreshes an expired token once and retries. */
export async function ownerUpload<T>(
  path: string,
  file: File,
  options: { schema: ZodType<T>; onProgress?: (ratio: number) => void },
): Promise<T> {
  const attempt = () => {
    const token = useSessionStore.getState().accessToken;
    return uploadFile(path, file, {
      ...options,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  try {
    return await attempt();
  } catch (error) {
    const expired =
      error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHENTICATED';
    if (expired && (await refreshSession())) return attempt();
    throw error;
  }
}
