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
 * Patterns matching the paths built above. Capture group 1 is the raw
 * (still-encoded) parameter.
 */
export const ROUTE_PATTERNS = {
  poemByDate: /^\/poem\/(\d{8})$/,
  author: /^\/author\/(.+)$/,
  poemByTitle: /^\/poems\/(.+)$/,
} as const;

/**
 * React Router path templates for the same shapes. These are what `<Route path>`
 * and `useMatch()` consume; keeping them beside the builders means a URL change
 * is a one-file edit.
 */
export const ROUTE_PATHS = {
  poemByDate: '/poem/:date',
  author: '/author/:name',
  poemByTitle: '/poems/:title',
} as const;

/** A date param is only usable if it is exactly YYYYMMDD. */
export function isValidDateParam(date: string | undefined): date is string {
  return typeof date === 'string' && /^\d{8}$/.test(date);
}
