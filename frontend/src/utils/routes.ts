/**
 * Application Routes
 *
 * Single source of truth for the app's URL shapes. Builders and the patterns
 * that parse them live together so a change to one cannot drift from the other.
 */

import { isRealCalendarDate } from './dateMapping';

/**
 * URL builders. Each takes the canonical value and returns an encoded path.
 */
export const ROUTES = {
  /**
   * Daily poem by broadcast date
   * @example poemByDate('20150315') → '/poem/20150315'
   */
  poemByDate: (date: string) => `/poem/${date}`,

  /**
   * Author page
   * @example author('Billy Collins') → '/author/Billy%20Collins'
   */
  author: (name: string) => `/author/${encodeURIComponent(name)}`,

  /**
   * Dates a poem title was featured
   * @example poemByTitle('The Road Not Taken') → '/poems/The%20Road%20Not%20Taken'
   */
  poemByTitle: (title: string) => `/poems/${encodeURIComponent(title)}`,
} as const;

/**
 * React Router path templates for the same shapes. These are what `<Route path>`
 * and `useMatch()` consume; keeping them beside the builders means a URL change
 * is a one-file edit.
 *
 * There is deliberately no table of hand-written regexes here any more. Routes
 * are matched by React Router, which binds exactly one path segment per
 * parameter — a second source of truth for the same URLs could only drift.
 */
export const ROUTE_PATHS = {
  poemByDate: '/poem/:date',
  author: '/author/:name',
  poemByTitle: '/poems/:title',
} as const;

/**
 * A date param is usable only if it is YYYYMMDD *and* names a real day.
 * The shape check alone would admit 20150230, which would then render an
 * empty broadcast page instead of the not-found page.
 *
 * The calendar rule itself lives with the other date utilities so there is
 * one definition of what counts as a date, not one per boundary.
 */
export function isValidDateParam(date: string | undefined): date is string {
  return typeof date === 'string' && isRealCalendarDate(date);
}
