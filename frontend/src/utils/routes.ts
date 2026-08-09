/**
 * Application Routes
 *
 * Single source of truth for the app's URL shapes. Builders and the patterns
 * that parse them live together so a change to one cannot drift from the other.
 */

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
 */
export function isValidDateParam(date: string | undefined): date is string {
  if (typeof date !== 'string' || !/^\d{8}$/.test(date)) {
    return false;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6));
  const day = Number(date.slice(6, 8));

  if (month < 1 || month > 12 || day < 1) {
    return false;
  }

  // Day 0 of the following month is the last day of this one, leap years included
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}
