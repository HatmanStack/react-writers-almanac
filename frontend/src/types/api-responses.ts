/**
 * Raw API Response Types
 *
 * These types match the exact shape returned by CloudFront/Lambda APIs.
 * They preserve the polymorphic nature of the API (string | string[]).
 *
 * DO NOT use these types directly in components.
 * Transform to internal types using functions in api/transforms.ts.
 */

// ============================================================================
// Poem API Response Types
// ============================================================================

/**
 * Raw poem response from CloudFront CDN.
 * Endpoint: /public/{YYYY}/{MM}/{YYYYMMDD}.json
 *
 * Note: Many fields can be either string or string[] depending on the date.
 * Older entries tend to be strings, newer entries are arrays.
 */
export interface RawPoemResponse {
  /** Day of the week (e.g., "Monday") - always string */
  dayofweek: string;

  /** Formatted date string (e.g., "January 1, 2024") - always string */
  date: string;

  /** Full transcript of the Writer's Almanac episode (may be empty/missing) */
  transcript?: string;

  /** Poem title - can be string or array depending on date */
  poemtitle: string | string[];

  /** Poem byline/subtitle - always string */
  poembyline: string;

  /** Author name(s) - can be string or array */
  author: string | string[];

  /** Poem content - can be string or array of lines */
  poem: string | string[];

  /** Additional notes about the poem or author - can be string or array */
  notes: string | string[];
}

// ============================================================================
// Author API Response Types
// ============================================================================

/**
 * Poem entry in author's poem list.
 * Can appear in various formats depending on source.
 */
export interface RawPoemEntry {
  /** Date of the poem feature */
  date?: string;
  /** Poem title */
  title?: string;
  /** Alternative: array of dates when poem was featured */
  dates?: string[] | Array<{ date: string; title?: string }>;
}

/**
 * Additional work reference (books, essays, etc.)
 */
export interface RawAdditionalWork {
  /** Title of the work */
  title: string;
  /** URL to more information */
  url: string;
  /** Source of the reference */
  source?: string;
}

/**
 * Metadata about the author from various sources.
 * Uses an index signature because fields vary by source.
 */
export interface RawAuthorMetadata {
  /** Lifetime/birth-death years (e.g., "1882–1956") */
  lifetime?: string;
  /** Author's website URL */
  website?: string;
  /** Birth information */
  Born?: string;
  /** Death information */
  Died?: string;
  /** Occupation */
  Occupation?: string;
  /** Nationality */
  Nationality?: string;
  /** Education */
  Education?: string;
  /** Notable works */
  'Notable works'?: string;
  /** Awards */
  Awards?: string;
  /** Any other metadata fields */
  [key: string]: string | undefined;
}

/**
 * Author data from a single source (Poetry Foundation, Wikipedia, etc.)
 */
export interface RawAuthorSource {
  /** Metadata about the poet */
  poet_meta_data?: RawAuthorMetadata;
  /** Biography text */
  biography?: string;
  /** URL to author photo */
  photo?: string;
  /**
   * Poems by this author - polymorphic format:
   * - string: single poem reference
   * - string[]: list of poem titles
   * - RawPoemEntry[]: structured poem data with dates
   */
  poems?: string | string[] | RawPoemEntry[];
  /** Source name */
  source?: string;
  /** Source URL */
  url?: string;
}

/**
 * Raw author response from S3/Lambda.
 * Endpoint: /authors/by-name/{slug}.json
 *
 * Author data is aggregated from multiple sources, each with different structures.
 * Sources may be either full AuthorSource objects or just URL strings.
 */
export interface RawAuthorResponse {
  /** Data from poets.org - can be object or URL string */
  'poets.org'?: RawAuthorSource | string;
  /** Data from Poetry Foundation */
  'poetry foundation'?: RawAuthorSource;
  /** Data from All Poetry - can be object or URL string */
  'all poetry'?: RawAuthorSource | string;
  /** Data from Wikipedia */
  wikipedia?: RawAuthorSource;

  // New structure fields (flat on root object)
  /** Direct biography (not nested in source) */
  biography?: string;
  /** Direct photo URLs */
  photos?: { primary: string };
  /** Direct poems list */
  poems?: RawPoemEntry[];
  /** Additional works */
  additionalWorks?: RawAdditionalWork[];

  /** Any other sources not explicitly typed */
  [key: string]: RawAuthorSource | string | RawPoemEntry[] | RawAdditionalWork[] | { primary: string } | undefined;
}

// ============================================================================
// Search API Response Types
// ============================================================================

/**
 * Single search result item.
 */
export interface RawSearchResult {
  /** Result type */
  type: 'author' | 'poem';
  /** Display name/title */
  name: string;
  /** Slug for lookup */
  slug: string;
  /** Additional info */
  info?: string;
}

/**
 * Raw search autocomplete response from Lambda.
 * Endpoint: /api/search/autocomplete?q={query}&limit={limit}
 */
export interface RawSearchResponse {
  /** Original search query */
  query: string;
  /** Array of search results */
  results: RawSearchResult[];
  /** Total matches found */
  total: number;
}

// ============================================================================
// Poem Dates API Response Types
// ============================================================================

/**
 * Date entry when a poem was featured.
 */
export interface RawPoemDateEntry {
  /** Date in various formats */
  date: string;
  /** Optional title if different from primary */
  title?: string;
}

/**
 * Raw response for dates when a poem was featured.
 * Can be either simple strings or structured entries.
 */
export interface RawPoemDatesResponse {
  /** Poem title */
  title: string;
  /** Dates when featured - polymorphic format */
  dates: string[] | RawPoemDateEntry[];
}
