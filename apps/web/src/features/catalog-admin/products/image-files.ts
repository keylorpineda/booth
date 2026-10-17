import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, MAX_PRODUCT_IMAGES } from '@booth/shared';

export type ImageRejection = 'UNSUPPORTED_FILE_TYPE' | 'FILE_TOO_LARGE' | 'TOO_MANY_IMAGES';

const ACCEPTED = new Set(IMAGE_ACCEPT.split(','));

/**
 * Splits the picked files into the ones to upload and the ones to refuse right away, with the
 * same error codes the API uses (it checks again with the real file bytes).
 */
export function checkImageFiles(
  files: readonly File[],
  existing: number,
): { accepted: File[]; rejected: { name: string; code: ImageRejection }[] } {
  const accepted: File[] = [];
  const rejected: { name: string; code: ImageRejection }[] = [];

  for (const file of files) {
    const code = rejection(file, existing + accepted.length);
    if (code) rejected.push({ name: file.name, code });
    else accepted.push(file);
  }
  return { accepted, rejected };
}

function rejection(file: File, count: number): ImageRejection | null {
  if (!ACCEPTED.has(file.type)) return 'UNSUPPORTED_FILE_TYPE';
  if (file.size > IMAGE_MAX_BYTES) return 'FILE_TOO_LARGE';
  if (count >= MAX_PRODUCT_IMAGES) return 'TOO_MANY_IMAGES';
  return null;
}
