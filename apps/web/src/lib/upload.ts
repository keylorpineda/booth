import { type ZodType } from 'zod';

import { ApiError, apiUrl, toApiError } from './api-client';

interface UploadOptions<T> {
  schema: ZodType<T>;
  onProgress?: (ratio: number) => void;
  headers?: Record<string, string>;
}

/**
 * Multipart upload of one file as `file`. XHR instead of fetch: fetch cannot report upload
 * progress yet. Errors come back as ApiError, like every other API call.
 */
export function uploadFile<T>(
  path: string,
  file: File,
  { schema, onProgress, headers = {} }: UploadOptions<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(path));
    xhr.withCredentials = true;
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onerror = () => {
      reject(new ApiError(0, 'NETWORK_ERROR', 'Network error'));
    };
    xhr.onload = () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // An empty or non-JSON body is handled as an unexpected response below.
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(schema.parse(payload));
      else reject(toApiError(xhr.status, payload));
    };
    const body = new FormData();
    body.append('file', file);
    xhr.send(body);
  });
}
