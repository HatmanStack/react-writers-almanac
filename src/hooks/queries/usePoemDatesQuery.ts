/**
 * TanStack Query hook for fetching poem dates
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { cdnClient } from '../../api/client';
import { CDN_ENDPOINTS, nameToSlug } from '../../api/endpoints';
import type { PoemDates } from '../../types/poemDates';
import type { ApiError } from '../../types/api';

/**
 * Query key factory for poem dates queries
 */
export const poemDatesKeys = {
  all: ['poemDates'] as const,
  bySlug: (slug: string) => ['poemDates', 'by-slug', slug] as const,
};

/**
 * Fetch poem dates from CDN
 * @param slug - Poem title slug (e.g., "the-road-not-taken")
 * @returns Poem dates data
 */
async function fetchPoemDates(slug: string): Promise<PoemDates> {
  const response = await cdnClient.get<PoemDates>(CDN_ENDPOINTS.getPoemBySlug(slug));
  return response.data;
}

/**
 * Hook to fetch poem dates by title
 *
 * @param title - Poem title (e.g., "The Road Not Taken")
 * @returns Query result with poem dates data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePoemDatesQuery("The Road Not Taken");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error loading poem dates</div>;
 * if (data) return <div>{data.dates.length} occurrences found</div>;
 * ```
 */
export function usePoemDatesQuery(title: string): UseQueryResult<PoemDates, ApiError> {
  // Normalize title to slug
  const slug = title ? nameToSlug(title) : '';

  const query = useQuery<PoemDates, ApiError>({
    queryKey: poemDatesKeys.bySlug(slug),
    queryFn: () => fetchPoemDates(slug),
    enabled: !!slug, // Only fetch if slug is valid
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - poem dates rarely change
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
    retry: (failureCount, error) => {
      // Safely extract HTTP status from different error shapes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any)?.status ?? (error as any)?.response?.status;

      // Don't retry 404 (poem not found) or other client errors
      if (status && status >= 400 && status < 500) {
        return false;
      }

      // Retry network errors and 5xx errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return query;
}
