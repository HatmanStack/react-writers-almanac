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
