/**
 * Poem data structure for daily poem content
 * Fetched from CloudFront: /public/{YYYYMMDD}.json
 */
export interface Poem {
  /** Day of the week (e.g., "Monday") */
  dayofweek: string;

  /** Formatted date string (e.g., "January 1, 2024") */
  date: string;

  /** Full transcript of the Writer's Almanac episode (may be empty for older dates) */
  transcript?: string;

  /** Poem title (can be multi-line, hence array) */
  poemtitle: string[];

  /** Poem byline/subtitle */
  poembyline: string;

  /** Author name(s) - array to support multiple authors */
  author: string[];

  /** Poem content (array of lines) */
  poem: string[];

  /** Additional notes about the poem or author */
  notes: string[];
}

/**
 * Poem request parameters
 */
export interface PoemParams {
  /** Date in YYYYMMDD format (e.g., "20240101") */
  date: string;
}

/**
 * Audio availability metadata
 */
export interface PoemAudio {
  /** URL to MP3 file or "NotAvailable" for dates before 2009-01-11 */
  url: string;
  /** Whether audio is available for this date */
  available: boolean;
}
