/**
 * TanStack Query hook for the client search index.
 *
 * The index is a static asset generated from a frozen archive, so it is fetched
 * once per session and never refetched: `staleTime: Infinity` means no
 * background revalidation, and an unbounded `gcTime` keeps it resident after
 * the last consumer unmounts. Navigating between routes must not re-download
 * 65 kB.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { fetchSearchIndex, type SearchIndex } from '../../utils/searchIndex';

/** Query key factory for the search index */
export const searchIndexKeys = {
  all: ['searchIndex'] as const,
};

/**
 * Fetch and build the search index.
 *
 * Consumers that gate rendering on the index must distinguish "still loading"
 * from "loaded, and this label is not in it" — see `AuthorView`. A failed fetch
 * is deliberately NOT fatal: the index only ever spared the app a round-trip,
 * so callers should fall back to letting the data request decide rather than
 * reporting every address as unknown.
 *
 * @returns The built index once resolved
 *
 * @example
 * const { data: index, isPending } = useSearchIndexQuery();
 * if (index?.hasAuthor('Billy Collins')) { ... }
 */
export function useSearchIndexQuery(): UseQueryResult<SearchIndex, Error> {
  return useQuery<SearchIndex, Error>({
    queryKey: searchIndexKeys.all,
    queryFn: ({ signal }) => fetchSearchIndex(signal),
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
