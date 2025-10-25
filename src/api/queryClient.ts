/**
 * TanStack Query Client Configuration
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient instance with default configuration
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error: Error) => {
        // Helper to safely extract HTTP status code from different error shapes
        const getStatus = (err: Error): number | undefined => {
          // ApiError shape (from our interceptor - has .status directly)
          if ('status' in err && typeof err.status === 'number') {
            return err.status;
          }
          // AxiosError shape (raw axios error - has .response.status)
          if ('response' in err && typeof err.response === 'object' && err.response !== null) {
            const response = err.response as { status?: number };
            return response.status;
          }
          return undefined;
        };

        const status = getStatus(error);

        // Don't retry any 4xx client errors (bad request, not found, unauthorized, etc.)
        if (status && status >= 400 && status < 500) {
          return false;
        }

        // Retry server errors (5xx) and network errors up to 3 times
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Stale time: how long data is considered fresh
      staleTime: 1000 * 60 * 5, // 5 minutes default

      // GC time: how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes default

      // Refetch behavior
      refetchOnWindowFocus: false, // Don't refetch on window focus (can be annoying)
      refetchOnReconnect: true, // Refetch when reconnecting

      // Network mode
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      networkMode: 'online',
    },
  },
});
