/**
 * TanStack Query hook for fetching daily poems
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { cdnClient } from '../../api/client';
import { CDN_ENDPOINTS } from '../../api/endpoints';
import type { Poem } from '../../types/poem';
import type { ApiError } from '../../types/api';

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
 * @param date - Date in YYYYMMDD format (e.g., "20240101")
 * @returns Query result with poem data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePoemQuery("20240101");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) return <div>{data.poemtitle}</div>;
 * ```
 */
export function usePoemQuery(date: string): UseQueryResult<Poem, ApiError> {
  return useQuery<Poem, ApiError>({
    queryKey: poemKeys.byDate(date),
    queryFn: () => fetchPoem(date),
    enabled: !!date && date.length === 8, // Only fetch if date is valid
    staleTime: 1000 * 60 * 60, // 1 hour - poems are immutable, can cache aggressively
    gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep in cache for a day
    retry: (failureCount, error) => {
      // Don't retry 404s (poem doesn't exist for that date)
      if (error.status === 404) return false;
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
