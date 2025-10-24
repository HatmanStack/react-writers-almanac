/**
 * Error handling utilities for TanStack Query hooks
 */

import type { ApiError } from '../../types/api';

/**
 * Map API errors to user-friendly messages
 */
export function getErrorMessage(error: ApiError | null, context: string): string {
  if (!error) return 'An unexpected error occurred';

  // Network errors
  if (!error.status) {
    return 'Unable to connect. Please check your internet connection.';
  }

  // HTTP status codes
  switch (error.status) {
    case 404:
      return `${context} not found`;
    case 400:
      return 'Invalid request. Please try again.';
    case 403:
      return 'Access denied';
    case 429:
      return 'Too many requests. Please wait a moment.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
}

/**
 * Get error message for author queries
 */
export function getAuthorErrorMessage(error: ApiError | null): string {
  return getErrorMessage(error, 'Author');
}

/**
 * Get error message for poem queries
 */
export function getPoemErrorMessage(error: ApiError | null): string {
  return getErrorMessage(error, 'Poem');
}

/**
 * Get error message for search queries
 */
export function getSearchErrorMessage(error: ApiError | null): string {
  if (!error) return 'Search failed';

  if (!error.status) {
    return 'Unable to search. Please check your internet connection.';
  }

  if (error.status === 400) {
    return 'Invalid search query';
  }

  return getErrorMessage(error, 'Search');
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  // Don't retry 4xx client errors (except 429 rate limit)
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return false;
  }

  // Retry 5xx server errors and network errors
  return true;
}
