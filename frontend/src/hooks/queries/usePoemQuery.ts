/**
 * TanStack Query hook for fetching daily poems
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { cdnClient } from '../../api/client';
import { CDN_ENDPOINTS } from '../../api/endpoints';
import type { Poem } from '../../types/poem';
import type { ApiError } from '../../types/api';
import { getPoemErrorMessage } from './queryErrors';

/**
 * Query key factory for poem queries
 */
export const poemKeys = {
  all: ['poems'] as const,
  byDate: (date: string) => ['poems', date] as const,
};

/**
 * Fetch poem data from CDN
 * @param date - Date in YYYYMMDD format
 * @returns Poem data
 */
async function fetchPoem(date: string): Promise<Poem> {
  const response = await cdnClient.get<Poem>(CDN_ENDPOINTS.getPoemByDate(date));
  return response.data;
}

/**
 * Hook to fetch daily poem by date
 *
 * TanStack Query v5 removed onError - handle errors via query.error instead
 *
 * @param date - Date in YYYYMMDD format (e.g., "20240101")
 * @returns Query result with poem data and user-friendly error message
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, errorMessage } = usePoemQuery("20240101");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {errorMessage}</div>;
 * if (data && data.poemtitle) return <div>{data.poemtitle[0]}</div>;
 * ```
 */
export function usePoemQuery(
  date: string
): UseQueryResult<Poem, ApiError> & { errorMessage: string | null } {
  const query = useQuery<Poem, ApiError>({
    queryKey: poemKeys.byDate(date),
    queryFn: () => fetchPoem(date),
    enabled: !!date && date.length === 8, // Only fetch if date is valid
    staleTime: 1000 * 60 * 60, // 1 hour - poems are immutable, can cache aggressively
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache for a day
    retry: (failureCount, error) => {
      // Safely extract HTTP status from different error shapes (ApiError or AxiosError)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any)?.status ?? (error as any)?.response?.status;

      // Don't retry any 4xx client errors (not found, bad request, etc.)
      if (status && status >= 400 && status < 500) {
        return false;
      }

      // Retry network errors and 5xx errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    // TanStack Query v5 removed onError - use query.error or error boundaries instead
  });

  // Get user-friendly error message
  const errorMessage = query.error ? getPoemErrorMessage(query.error) : null;

  return {
    ...query,
    errorMessage,
  };
}
