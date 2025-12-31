/**
 * Type definitions for poem dates data
 */

/**
 * Single date entry for when a poem appeared
 */
export interface PoemDateEntry {
  date: string; // In format like "Jan. 15, 2024" or similar
  formattedDate?: string; // YYYYMMDD format for navigation
}

/**
 * Poem dates data from API
 */
export interface PoemDates {
  title: string;
  dates: string[] | PoemDateEntry[]; // List of dates when this poem appeared
}
