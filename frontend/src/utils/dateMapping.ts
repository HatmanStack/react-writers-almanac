/**
 * Date Mapping Utilities
 *
 * Handles date formatting, year mappings, and boundary constraints
 * for the Writer's Almanac archive (1993-2017).
 */

import { formatDate as baseFormatDate } from './index';

// ============================================================================
// Constants
// ============================================================================

/**
 * Archive date boundaries.
 * The Writer's Almanac archive spans from January 1, 1993 to November 29, 2017.
 */
export const DATE_BOUNDARIES = {
  /** Earliest available date in YYYYMMDD format */
  MIN_DATE: 19930101,
  /** Latest available date in YYYYMMDD format */
  MAX_DATE: 20171129,
  /** Minimum date as string */
  MIN_DATE_STRING: '19930101',
  /** Maximum date as string */
  MAX_DATE_STRING: '20171129',
} as const;

/**
 * Year mapping for present-day dates.
 * Maps current calendar years to archive years with similar day-of-week alignment.
 */
export const YEAR_MAPPINGS: Record<string, string> = {
  '2026': '2015',
  '2027': '2010',
} as const;

/** Default fallback year when current year isn't in YEAR_MAPPINGS */
export const DEFAULT_ARCHIVE_YEAR = '2014';

/**
 * Month abbreviation to numeric string mapping.
 */
export const MONTH_ABBREVIATIONS: Record<string, string> = {
  Jan: '01',
  Feb: '02',
  Mar: '03',
  Apr: '04',
  May: '05',
  Jun: '06',
  Jul: '07',
  Aug: '08',
  Sep: '09',
  Oct: '10',
  Nov: '11',
  Dec: '12',
} as const;

// ============================================================================
// Date Formatting Functions
// ============================================================================

/**
 * Format a date with optional boundary clamping.
 *
 * @param date - Date to format
 * @param applyBoundaries - Whether to clamp to archive boundaries (default: true)
 * @param separator - Separator between year/month/day (default: '')
 * @returns Formatted date string (YYYYMMDD or YYYY<sep>MM<sep>DD)
 *
 * @example
 * formatDate(new Date('1990-01-01')) // '19930101' (clamped to min)
 * formatDate(new Date('2020-01-01')) // '20171129' (clamped to max)
 * formatDate(new Date('2015-06-15')) // '20150615'
 * formatDate(new Date('2015-06-15'), true, '-') // '2015-06-15'
 */
export function formatDate(
  date: Date,
  applyBoundaries: boolean = true,
  separator: string = ''
): string {
  let formattedDate = baseFormatDate(date, separator);

  if (applyBoundaries) {
    // Compare numeric values for boundary check
    const numericDate = Number(formattedDate.replace(/-/g, ''));
    if (numericDate < DATE_BOUNDARIES.MIN_DATE) {
      formattedDate = separator
        ? `1993${separator}01${separator}01`
        : DATE_BOUNDARIES.MIN_DATE_STRING;
    } else if (numericDate > DATE_BOUNDARIES.MAX_DATE) {
      formattedDate = separator
        ? `2017${separator}11${separator}29`
        : DATE_BOUNDARIES.MAX_DATE_STRING;
    }
  }

  return formattedDate;
}

/**
 * Get the present date mapped to an appropriate archive date.
 * Uses year mappings to find archive dates with similar day-of-week alignment.
 *
 * @returns Archive date string in YYYYMMDD format
 *
 * @example
 * // If today is 2026-03-15:
 * presentDate() // '20150315'
 */
export function presentDate(): string {
  const today = formatDate(new Date(), false);
  const year = today.substring(0, 4);
  const archiveYear = YEAR_MAPPINGS[year] ?? DEFAULT_ARCHIVE_YEAR;
  return archiveYear + today.substring(4);
}

/**
 * Parse a date string in "Mon. DD, YYYY" format to YYYYMMDD.
 *
 * @param dateString - Date in format like "Jan. 15, 2015" or "January 15, 2015"
 * @returns Date string in YYYYMMDD format
 *
 * @example
 * formatAuthorDate('Jan. 15, 2015') // '20150115'
 * formatAuthorDate('December 1, 2010') // '20101201'
 */
export function formatAuthorDate(dateString: string): string {
  const [month, day, year] = dateString.trim().split(' ');
  // Remove trailing period from month abbreviation
  const monthKey = month.replace('.', '').substring(0, 3);
  const formattedMonth = MONTH_ABBREVIATIONS[monthKey] || '01';
  const formattedDay = day.replace(',', '').padStart(2, '0');
  return `${year}${formattedMonth}${formattedDay}`;
}

/**
 * Parse a YYYYMMDD string into a Date object using local timezone.
 *
 * @param dateString - Date in YYYYMMDD format
 * @returns Date object
 *
 * @example
 * parseArchiveDate('20150315') // Date for March 15, 2015 in local time
 */
export function parseArchiveDate(dateString: string): Date {
  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(dateString.substring(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Convert YYYYMMDD to path format YYYY/MM/YYYYMMDD.
 *
 * @param dateString - Date in YYYYMMDD format
 * @returns Path string like "2015/03/20150315"
 */
export function dateToPath(dateString: string): string {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  return `${year}/${month}/${dateString}`;
}

/**
 * Check if a date string is within archive boundaries.
 *
 * @param dateString - Date in YYYYMMDD format
 * @returns True if date is within archive range
 */
export function isWithinArchive(dateString: string): boolean {
  const numericDate = Number(dateString);
  return numericDate >= DATE_BOUNDARIES.MIN_DATE && numericDate <= DATE_BOUNDARIES.MAX_DATE;
}
