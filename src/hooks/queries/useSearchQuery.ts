/**
 * TanStack Query hook for search autocomplete
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { SearchResponse } from '../../types/api';
import type { ApiError } from '../../types/api';
import { getSearchErrorMessage } from './queryErrors';

/**
 * Query key factory for search queries
 */
export const searchKeys = {
  all: ['search'] as const,
  query: (q: string, limit: number) => ['search', 'autocomplete', q, limit] as const,
};

/**
 * Fetch search results from API
 * @param query - Search query string
 * @param limit - Maximum number of results
 * @returns Search response
 */
async function fetchSearchResults(query: string, limit: number): Promise<SearchResponse> {
  const response = await apiClient.get<SearchResponse>(API_ENDPOINTS.searchAutocomplete(), {
    params: {
      q: query,
      limit,
    },
  });
  return response.data;
}

export interface SearchQueryOptions {
  /** Callback fired when an error occurs */
  onError?: (error: ApiError) => void;
}

/**
 * Hook to search for authors and poems
 *
 * Note: Consider debouncing the query string at the component level
 * to avoid excessive API calls while typing.
 *
 * @param query - Search query string (minimum 1 character)
 * @param limit - Maximum results (default: 10)
 * @param options - Optional configuration
 * @returns Query result with search results and user-friendly error message
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, errorMessage } = useSearchQuery("billy");
 *
 * // With custom limit
 * const { data } = useSearchQuery("billy", 20);
 *
 * // With debouncing (recommended)
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 * const { data } = useSearchQuery(debouncedQuery);
 * ```
 */
export function useSearchQuery(
  query: string,
  limit: number = 10,
  options?: SearchQueryOptions
): UseQueryResult<SearchResponse, ApiError> & { errorMessage: string | null } {
  const trimmedQuery = query.trim();

  const queryResult = useQuery<SearchResponse, ApiError>({
    queryKey: searchKeys.query(trimmedQuery, limit),
    queryFn: () => fetchSearchResults(trimmedQuery, limit),
    enabled: trimmedQuery.length >= 1, // Only search if query has at least 1 character
    staleTime: 1000 * 60 * 5, // 5 minutes - search results can be cached briefly
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry 400 errors (bad request)
      if (error.status === 400) return false;
      // Don't retry 4xx client errors
      if (error.status >= 400 && error.status < 500) return false;
      // Retry network errors and 5xx errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    meta: {
      onError: options?.onError,
    },
  });

  // Get user-friendly error message
  const errorMessage = queryResult.error ? getSearchErrorMessage(queryResult.error) : null;

  // Call onError callback if provided
  if (queryResult.error && options?.onError) {
    options.onError(queryResult.error);
  }

  return {
    ...queryResult,
    errorMessage,
  };
}
