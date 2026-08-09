/**
 * useUrlSync - URL ↔ State Synchronization Hook
 *
 * Manages bidirectional synchronization between URL routes and application state.
 * Handles /poem/:date and /author/:name routes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { presentDate } from '../utils/dateMapping';
import { ROUTES, ROUTE_PATTERNS } from '../utils/routes';

interface UseUrlSyncOptions {
  /** Set of valid author names for validation */
  validAuthors: ReadonlySet<string>;
  /** Set of valid poem titles for validation */
  validPoems: ReadonlySet<string>;
  /** Callback when search term changes */
  setSearchTerm: (term: string) => void;
  /** Callback when view mode changes */
  setViewMode: (isShowingByDate: boolean) => void;
}

/**
 * Decode a route parameter, tolerating malformed input.
 *
 * decodeURIComponent throws URIError on a stray percent (a shared link like
 * `/author/%`), which would take down the render instead of showing nothing.
 *
 * @param value - Raw, still-encoded path segment
 * @returns The decoded value, or null when it cannot be decoded
 */
function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

interface UseUrlSyncResult {
  /** Current date string in YYYYMMDD format */
  linkDate: string;
  /** Update linkDate and sync to URL */
  setLinkDate: (dateOrUpdater: string | ((prev: string) => string)) => void;
  /** Current search type based on URL */
  searchType: 'author' | 'poem' | null;
  /** Update search type */
  setSearchType: (type: 'author' | 'poem' | null) => void;
}

/**
 * Hook to synchronize URL routes with application state.
 *
 * Handles four URL patterns:
 * - `/poem/:date` - Date-based poem viewing
 * - `/author/:name` - Author page viewing
 * - `/poems/:title` - Dates a poem title was featured
 * - `/` - Redirects to today's poem
 *
 * @param options - Configuration options
 * @returns URL sync state and setters
 *
 * @example
 * ```tsx
 * const { linkDate, setLinkDate, searchType, setSearchType } = useUrlSync({
 *   validAuthors: authorsSet,
 *   setSearchTerm,
 *   setViewMode,
 * });
 * ```
 */
export function useUrlSync({
  validAuthors,
  validPoems,
  setSearchTerm,
  setViewMode,
}: UseUrlSyncOptions): UseUrlSyncResult {
  const navigate = useNavigate();
  const location = useLocation();

  // Local state
  const [linkDate, setLinkDateState] = useState<string>(presentDate());
  const [searchType, setSearchType] = useState<'author' | 'poem' | null>(null);

  // Track the previous pathname to detect actual navigation changes
  const previousPathnameRef = useRef(location.pathname);

  // Handle URL-based navigation
  useEffect(() => {
    const path = location.pathname;
    const previousPath = previousPathnameRef.current;

    // Update ref for next comparison
    previousPathnameRef.current = path;

    // Handle /poem/:date route
    const poemMatch = path.match(ROUTE_PATTERNS.poemByDate);
    if (poemMatch) {
      const urlDate = poemMatch[1];
      // Only update if the date actually changed (avoid loops)
      if (urlDate !== linkDate || previousPath !== path) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- URL sync requires state update
        setLinkDateState(urlDate);
        setViewMode(true);
      }
      return;
    }

    // Handle /author/:name route
    const authorMatch = path.match(ROUTE_PATTERNS.author);
    if (authorMatch) {
      const authorName = safeDecode(authorMatch[1]);
      if (authorName && validAuthors.has(authorName)) {
        setSearchTerm(authorName);

        setSearchType('author');
        setViewMode(false);
      }
      return;
    }

    // Handle /poems/:title route
    const poemTitleMatch = path.match(ROUTE_PATTERNS.poemByTitle);
    if (poemTitleMatch) {
      const poemTitle = safeDecode(poemTitleMatch[1]);
      if (poemTitle && validPoems.has(poemTitle)) {
        setSearchTerm(poemTitle);

        setSearchType('poem');
        setViewMode(false);
      }
      return;
    }

    // Handle root - redirect to today's poem
    if (path === '/') {
      navigate(ROUTES.poemByDate(presentDate()), { replace: true });
    }
  }, [location.pathname, navigate, setSearchTerm, setViewMode, linkDate, validAuthors, validPoems]);

  // URL-synced setLinkDate - updates URL when date changes
  const setLinkDate = useCallback(
    (dateOrUpdater: string | ((prev: string) => string)) => {
      setLinkDateState(prev => {
        const newDate = typeof dateOrUpdater === 'function' ? dateOrUpdater(prev) : dateOrUpdater;
        // Update URL to reflect new date
        navigate(ROUTES.poemByDate(newDate), { replace: true });
        return newDate;
      });
    },
    [navigate]
  );

  return {
    linkDate,
    setLinkDate,
    searchType,
    setSearchType,
  };
}
