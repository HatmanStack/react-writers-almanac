/**
 * TanStack Query hook for search autocomplete
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { SearchResponse, ApiError } from '../../types/api';
import { getErrorStatus } from '../../types/errors';
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

/**
 * Hook to search for authors and poems
 *
 * Note: Consider debouncing the query string at the component level
 * to avoid excessive API calls while typing.
 *
 * TanStack Query v5 removed onError - handle errors via query.error instead
 *
 * @param query - Search query string (minimum 1 character)
 * @param limit - Maximum results (default: 10)
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
  limit: number = 10
): UseQueryResult<SearchResponse, ApiError> & { errorMessage: string | null } {
  const trimmedQuery = query.trim();

  // Validate limit parameter to prevent API errors
  const validatedLimit = Math.max(1, Math.min(limit, 100)); // Clamp between 1-100

  const queryResult = useQuery<SearchResponse, ApiError>({
    queryKey: searchKeys.query(trimmedQuery, validatedLimit),
    queryFn: () => fetchSearchResults(trimmedQuery, validatedLimit),
    enabled: trimmedQuery.length >= 1, // Only search if query has at least 1 character
    staleTime: 1000 * 60 * 5, // 5 minutes - search results can be cached briefly
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      // Type-safe HTTP status extraction using error type guards
      const status = getErrorStatus(error);

      // Don't retry any 4xx client errors (bad request, not found, etc.)
      if (status !== undefined && status >= 400 && status < 500) {
        return false;
      }

      // Retry network errors and 5xx errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    // TanStack Query v5 removed onError - use query.error or error boundaries instead
  });

  // Get user-friendly error message
  const errorMessage = queryResult.error ? getSearchErrorMessage(queryResult.error) : null;

  return {
    ...queryResult,
    errorMessage,
  };
}
