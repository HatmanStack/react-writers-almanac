/**
 * TanStack Query hook for fetching author data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { cdnClient } from '../../api/client';
import { CDN_ENDPOINTS, nameToSlug } from '../../api/endpoints';
import type { Author } from '../../types/author';
import type { ApiError } from '../../types/api';

/**
 * Query key factory for author queries
 */
export const authorKeys = {
  all: ['authors'] as const,
  bySlug: (slug: string) => ['authors', 'by-slug', slug] as const,
};

/**
 * Fetch author data from CDN
 * @param slug - Author slug (e.g., "billy-collins")
 * @returns Author data
 */
async function fetchAuthor(slug: string): Promise<Author> {
  const response = await cdnClient.get<Author>(CDN_ENDPOINTS.getAuthorBySlug(slug));
  return response.data;
}

/**
 * Hook to fetch author data by name or slug
 *
 * @param name - Author name or slug (e.g., "Billy Collins" or "billy-collins")
 * @returns Query result with author data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAuthorQuery("Billy Collins");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * if (data) return <div>{data['poetry foundation']?.biography}</div>;
 * ```
 */
export function useAuthorQuery(name: string): UseQueryResult<Author, ApiError> {
  // Normalize name to slug
  const slug = name ? nameToSlug(name) : '';

  return useQuery<Author, ApiError>({
    queryKey: authorKeys.bySlug(slug),
    queryFn: () => fetchAuthor(slug),
    enabled: !!slug, // Only fetch if slug is valid
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - author data rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
    retry: (failureCount, error) => {
      // Don't retry 404s (author doesn't exist)
      if (error.status === 404) return false;
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
