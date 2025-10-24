/**
 * TanStack Query hook for search autocomplete
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { API_ENDPOINTS } from '../../api/endpoints';
import type { SearchResponse } from '../../types/api';
import type { ApiError } from '../../types/api';

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
 * @param query - Search query string (minimum 1 character)
 * @param limit - Maximum results (default: 10)
 * @returns Query result with search results
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading } = useSearchQuery("billy");
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
): UseQueryResult<SearchResponse, ApiError> {
  const trimmedQuery = query.trim();

  return useQuery<SearchResponse, ApiError>({
    queryKey: searchKeys.query(trimmedQuery, limit),
    queryFn: () => fetchSearchResults(trimmedQuery, limit),
    enabled: trimmedQuery.length >= 1, // Only search if query has at least 1 character
    staleTime: 1000 * 60 * 5, // 5 minutes - search results can be cached briefly
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: (failureCount, error) => {
      // Don't retry 400 errors (bad request)
      if (error.status === 400) return false;
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}
