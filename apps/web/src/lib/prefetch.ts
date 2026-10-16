interface StorefrontPrefetch {
  slug: string;
  store?: Promise<unknown> | undefined;
  catalog?: Promise<unknown> | undefined;
}

declare global {
  interface Window {
    __BOOTH_PREFETCH__?: StorefrontPrefetch;
  }
}

/**
 * Takes the response started by the inline script in index.html (if it matches this slug).
 * Each response is used once; on any failure the caller falls back to a normal request, which
 * produces the proper ApiError.
 */
export async function takePrefetched<T>(
  kind: 'store' | 'catalog',
  slug: string,
): Promise<T | undefined> {
  const prefetch = window.__BOOTH_PREFETCH__;
  const request = prefetch?.slug === slug ? prefetch[kind] : undefined;
  if (!prefetch || !request) return undefined;
  prefetch[kind] = undefined;

  try {
    return (await request) as T;
  } catch {
    return undefined;
  }
}
