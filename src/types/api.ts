import { Poem } from './poem';
import { Author, AuthorsByLetter } from './author';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Success status */
  success: boolean;
  /** Optional message */
  message?: string;
  /** Timestamp of response */
  timestamp?: string;
}

/**
 * API error response
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** HTTP status code */
  status: number;
  /** Error code (for client-side handling) */
  code?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Timestamp of error */
  timestamp: string;
}

/**
 * Search result item
 */
export interface SearchResult {
  /** Result type (author or poem) */
  type: 'author' | 'poem';
  /** Display name/title */
  name: string;
  /** Slug or identifier for lookup */
  slug: string;
  /** Optional additional info */
  info?: string;
}

/**
 * Search autocomplete request parameters
 */
export interface SearchParams {
  /** Search query string */
  q: string;
  /** Maximum number of results (default: 10) */
  limit?: number;
}

/**
 * Search autocomplete response
 */
export interface SearchResponse {
  /** Search query that was executed */
  query: string;
  /** Array of search results */
  results: SearchResult[];
  /** Total number of matches found */
  total: number;
}

/**
 * API endpoint definitions
 */
export const API_ENDPOINTS = {
  /** Get daily poem by date */
  POEM: (date: string) => `/public/${date}.json` as const,
  /** Get poem audio file */
  POEM_AUDIO: (date: string) => `/public/${date}.mp3` as const,
  /** Get author by name/slug */
  AUTHOR: (slug: string) => `/api/author/${slug}` as const,
  /** Get authors by first letter */
  AUTHORS_BY_LETTER: (letter: string) => `/api/authors/letter/${letter}` as const,
  /** Search autocomplete */
  SEARCH: '/api/search/autocomplete' as const,
} as const;

/**
 * Type-safe API client methods
 */
export interface ApiClient {
  /** Fetch daily poem */
  getPoem(date: string): Promise<Poem>;
  /** Fetch author data */
  getAuthor(slug: string): Promise<Author>;
  /** Fetch authors by letter */
  getAuthorsByLetter(letter: string): Promise<AuthorsByLetter>;
  /** Search for authors and poems */
  search(query: string, limit?: number): Promise<SearchResponse>;
}
