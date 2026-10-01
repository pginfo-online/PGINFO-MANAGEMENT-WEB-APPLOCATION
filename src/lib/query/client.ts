import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/errors/api-error';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) {
              return false;
            }
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: reuse client across renders
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}
