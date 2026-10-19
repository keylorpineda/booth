import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-client';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry network and server errors (the free API may be waking up), never 4xx answers.
        retry: (failureCount, error) =>
          failureCount < 3 &&
          !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        refetchOnWindowFocus: false,
      },
    },
  });
}
