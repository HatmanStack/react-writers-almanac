/**
 * TanStack Query hook for fetching author data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { cdnClient } from '../../api/client';
import { CDN_ENDPOINTS, nameToSlug } from '../../api/endpoints';
import type { Author } from '../../types/author';
import type { ApiError } from '../../types/api';
import { getAuthorErrorMessage } from './queryErrors';

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

export interface AuthorQueryOptions {
  /** Callback fired when an error occurs */
  onError?: (error: ApiError) => void;
}

/**
 * Hook to fetch author data by name or slug
 *
 * @param name - Author name or slug (e.g., "Billy Collins" or "billy-collins")
 * @param options - Optional configuration
 * @returns Query result with author data and user-friendly error message
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, errorMessage } = useAuthorQuery("Billy Collins");
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {errorMessage}</div>;
 * if (data) return <div>{data['poetry foundation']?.biography}</div>;
 * ```
 */
export function useAuthorQuery(
  name: string,
  options?: AuthorQueryOptions
): UseQueryResult<Author, ApiError> & { errorMessage: string | null } {
  // Normalize name to slug
  const slug = name ? nameToSlug(name) : '';

  const query = useQuery<Author, ApiError>({
    queryKey: authorKeys.bySlug(slug),
    queryFn: () => fetchAuthor(slug),
    enabled: !!slug, // Only fetch if slug is valid
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - author data rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days - keep in cache for a week
    retry: (failureCount, error) => {
      // Don't retry 404s (author doesn't exist)
      if (error.status === 404) return false;
      // Don't retry 4xx client errors
      if (error.status >= 400 && error.status < 500) return false;
      // Retry network errors and 5xx errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      onError: options?.onError,
    },
  });

  // Get user-friendly error message
  const errorMessage = query.error ? getAuthorErrorMessage(query.error) : null;

  // Call onError callback if provided
  if (query.error && options?.onError) {
    options.onError(query.error);
  }

  return {
    ...query,
    errorMessage,
  };
}
