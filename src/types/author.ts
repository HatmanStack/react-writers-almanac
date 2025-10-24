/**
 * Author metadata from various sources
 */
export interface AuthorMetadata {
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
 * Data from a single source (Poetry Foundation, Wikipedia, etc.)
 */
export interface AuthorSource {
  /** Metadata about the poet */
  poet_meta_data?: AuthorMetadata;
  /** Biography text */
  biography?: string;
  /** URL to author photo */
  photo?: string;
  /** Poems by this author (if available) */
  poems?: string | string[];
  /** Source name */
  source?: string;
  /** Source URL */
  url?: string;
}

/**
 * Complete author data structure
 * Contains data aggregated from multiple sources
 */
export interface Author {
  /** Data from poets.org */
  'poets.org'?: AuthorSource | string;
  /** Data from Poetry Foundation */
  'poetry foundation'?: AuthorSource;
  /** Data from All Poetry */
  'all poetry'?: AuthorSource | string;
  /** Data from Wikipedia */
  wikipedia?: AuthorSource;
  /** Any other sources */
  [key: string]: AuthorSource | string | undefined;
}

/**
 * Author lookup parameters
 */
export interface AuthorParams {
  /** Author name (will be normalized to slug format) */
  name: string;
}

/**
 * Authors grouped by first letter
 */
export interface AuthorsByLetter {
  /** Letter (A-Z) */
  letter: string;
  /** Array of author names starting with this letter */
  authors: string[];
}

/**
 * Request parameters for authors by letter
 */
export interface AuthorsByLetterParams {
  /** First letter (A-Z) */
  letter: string;
}
