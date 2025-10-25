/**
 * API Endpoints Configuration
 *
 * Centralized endpoint definitions for all API calls
 */

import { formatDate, slugify } from '../utils';

/**
 * CDN Endpoints (CloudFront)
 * Static content served from S3 via CloudFront
 */
export const CDN_ENDPOINTS = {
  /**
   * Get daily poem by date
   * @param date - Date in YYYYMMDD format (e.g., "20240101")
   * @returns Path to poem JSON file
   * @example getPoemByDate("20240101") → "/public/20240101.json"
   */
  getPoemByDate: (date: string) => `/public/${date}.json`,

  /**
   * Get poem audio file
   * @param date - Date in YYYYMMDD format
   * @returns Path to MP3 file
   * @example getPoemAudio("20240101") → "/public/20240101.mp3"
   */
  getPoemAudio: (date: string) => `/public/${date}.mp3`,

  /**
   * Get author by slug
   * @param slug - Author slug (e.g., "billy-collins")
   * @returns Path to author JSON file
   * @example getAuthorBySlug("billy-collins") → "/authors/by-name/billy-collins.json"
   */
  getAuthorBySlug: (slug: string) => `/authors/by-name/${slug}.json`,

  /**
   * Get authors by first letter
   * @param letter - Single uppercase letter A-Z
   * @returns Path to letter JSON file
   * @example getAuthorsByLetter("B") → "/authors/by-letter/B.json"
   */
  getAuthorsByLetter: (letter: string) => `/authors/by-letter/${letter.toUpperCase()}.json`,
} as const;

/**
 * API Gateway Endpoints
 * Dynamic endpoints powered by Lambda functions
 */
export const API_ENDPOINTS = {
  /**
   * Get author by name/slug via API Gateway
   * @param slug - Author slug (e.g., "billy-collins")
   * @returns API path
   * @example getAuthor("billy-collins") → "/api/author/billy-collins"
   */
  getAuthor: (slug: string) => `/api/author/${slug}`,

  /**
   * Get authors by first letter via API Gateway
   * @param letter - Single uppercase letter A-Z
   * @returns API path
   * @example getAuthorsByLetter("B") → "/api/authors/letter/B"
   */
  getAuthorsByLetter: (letter: string) => `/api/authors/letter/${letter.toUpperCase()}`,

  /**
   * Search autocomplete endpoint
   * @returns API path
   * @example searchAutocomplete() → "/api/search/autocomplete"
   */
  searchAutocomplete: () => '/api/search/autocomplete',
} as const;

/**
 * Helper function to convert author name to slug
 * @param name - Author name (e.g., "Billy Collins")
 * @returns Slug (e.g., "billy-collins")
 */
export function nameToSlug(name: string): string {
  return slugify(name);
}

/**
 * Helper function to format date to YYYYMMDD
 * @param date - Date object
 * @returns Formatted date string
 * @example formatDateToYYYYMMDD(new Date("2024-01-01")) → "20240101"
 */
export function formatDateToYYYYMMDD(date: Date): string {
  return formatDate(date);
}

/**
 * Helper function to parse YYYYMMDD to Date
 * @param dateString - Date string in YYYYMMDD format
 * @returns Date object
 * @throws Error if dateString is not valid YYYYMMDD format
 * @example parseDateFromYYYYMMDD("20240101") → Date(2024, 0, 1)
 */
export function parseDateFromYYYYMMDD(dateString: string): Date {
  // Validate format: exactly 8 digits
  if (!/^\d{8}$/.test(dateString)) {
    throw new Error(`Invalid date format: expected YYYYMMDD (8 digits), got "${dateString}"`);
  }

  const year = parseInt(dateString.substring(0, 4), 10);
  const month = parseInt(dateString.substring(4, 6), 10) - 1; // Month is 0-indexed
  const day = parseInt(dateString.substring(6, 8), 10);

  // Validate date is actually valid (e.g., not Feb 30)
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateString} does not represent a valid calendar date`);
  }

  return date;
}

/**
 * Helper function to check if audio is available for a date
 * Audio only available for dates after 2009-01-11
 * @param dateString - Date string in YYYYMMDD format
 * @returns True if audio is available
 */
export function isAudioAvailable(dateString: string): boolean {
  const AUDIO_START_DATE = 20090111;
  const dateNum = parseInt(dateString, 10);
  return dateNum > AUDIO_START_DATE;
}
