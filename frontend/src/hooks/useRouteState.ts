/**
 * useRouteState - URL → View State Derivation
 *
 * Replaces the old effect-based URL sync. The URL is the single source of
 * truth: every value here is computed from the current route during render,
 * so the view can never lag behind the address bar. That is what makes the
 * browser's back and forward buttons work — a POP changes the location, the
 * location changes these values, and the correct page renders. Nothing has to
 * be un-set by hand.
 */

import { useEffect } from 'react';
import { useMatch } from 'react-router-dom';
import { ROUTE_PATHS, isValidDateParam } from '../utils/routes';
import { useAppStore } from '../store/useAppStore';

export type SearchType = 'author' | 'poem' | null;

export interface RouteState {
  /**
   * Broadcast date driving the header and audio player, in YYYYMMDD format.
   * Always a valid date, even on author and poem-title routes.
   */
  activeDate: string;
  /** True when the current route renders a daily broadcast. */
  isShowingContentByDate: boolean;
  /** Author name or poem title addressed by the route; empty on date routes. */
  searchTerm: string;
  /** Which kind of search page is showing, or null on a date route. */
  searchType: SearchType;
}

/**
 * Derive all view state from the current route.
 *
 * Route params arrive already percent-decoded from React Router, so names like
 * `Billy Collins` and titles containing `&` need no further unescaping here.
 */
export function useRouteState(): RouteState {
  const dateMatch = useMatch(ROUTE_PATHS.poemByDate);
  const authorMatch = useMatch(ROUTE_PATHS.author);
  const poemTitleMatch = useMatch(ROUTE_PATHS.poemByTitle);

  const dateParam = dateMatch?.params.date;

  /*
   * The header keeps displaying a broadcast date, and the audio player keeps
   * its track, while the reader browses an author or poem-title page — so the
   * last real date has to outlive the date route that supplied it. That makes
   * it session state rather than render state, and the store is where it lives.
   *
   * Recording it in an effect costs nothing, because `activeDate` prefers the
   * live param whenever there is one and only falls back to the stored value on
   * routes that carry no date. By then the effect has run, so it is never stale.
   */
  const rememberedDate = useAppStore(state => state.activeDate);
  const setActiveDate = useAppStore(state => state.setActiveDate);

  useEffect(() => {
    if (isValidDateParam(dateParam)) {
      setActiveDate(dateParam);
    }
  }, [dateParam, setActiveDate]);

  const activeDate = isValidDateParam(dateParam) ? dateParam : rememberedDate;

  if (authorMatch?.params.name) {
    return {
      activeDate,
      isShowingContentByDate: false,
      searchTerm: authorMatch.params.name,
      searchType: 'author',
    };
  }

  if (poemTitleMatch?.params.title) {
    return {
      activeDate,
      isShowingContentByDate: false,
      searchTerm: poemTitleMatch.params.title,
      searchType: 'poem',
    };
  }

  return {
    activeDate,
    // A malformed date param falls through to the not-found page, which is not
    // a broadcast view, so the audio player must not treat it as one.
    isShowingContentByDate: isValidDateParam(dateParam),
    searchTerm: '',
    searchType: null,
  };
}
