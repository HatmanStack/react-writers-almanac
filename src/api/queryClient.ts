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
        // Don't retry 404s
        if ('status' in error && error.status === 404) return false;
        // Don't retry 400s (client errors)
        if ('status' in error && error.status === 400) return false;
        // Retry server errors up to 3 times
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
