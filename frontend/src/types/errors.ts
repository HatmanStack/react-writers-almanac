/**
 * Error Type Guards and Utilities
 *
 * Provides type-safe error handling for query retry logic and error extraction.
 * Eliminates need for `any` type casts when working with mixed error shapes.
 */

import type { AxiosError } from 'axios';
import type { ApiError } from './api';

/**
 * Union type for all possible error shapes in the application.
 * - ApiError: Our normalized error format from interceptors
 * - AxiosError: Raw axios errors (network failures, timeouts)
 * - Error: Standard JavaScript errors
 */
export type QueryError = ApiError | AxiosError | Error;

/**
 * Type guard to check if an error is our ApiError shape.
 * ApiError has a numeric `status` property directly on the object.
 *
 * @param error - Unknown error to check
 * @returns True if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    'timestamp' in error &&
    typeof (error as ApiError).status === 'number' &&
    typeof (error as ApiError).message === 'string'
  );
}

/**
 * Type guard to check if an error is an AxiosError.
 * AxiosError has an `isAxiosError` property set to true.
 *
 * @param error - Unknown error to check
 * @returns True if error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

/**
 * Extract HTTP status code from any error shape (type-safe).
 *
 * Handles multiple error structures:
 * - ApiError: status is directly on the object
 * - AxiosError: status is in response.status
 * - Other errors: returns undefined
 *
 * @param error - Unknown error to extract status from
 * @returns HTTP status code or undefined if not available
 *
 * @example
 * ```typescript
 * retry: (failureCount, error) => {
 *   const status = getErrorStatus(error);
 *   if (status && status >= 400 && status < 500) {
 *     return false; // Don't retry 4xx errors
 *   }
 *   return failureCount < 3;
 * }
 * ```
 */
export function getErrorStatus(error: unknown): number | undefined {
  // Check for our ApiError format first (most common after interceptor)
  if (isApiError(error)) {
    return error.status;
  }

  // Check for raw AxiosError (before interceptor transforms it)
  if (isAxiosError(error)) {
    return error.response?.status;
  }

  // Unknown error shape - no status available
  return undefined;
}

/**
 * Check if an error is a network error (no response received).
 *
 * @param error - Unknown error to check
 * @returns True if this is a network-level failure
 */
export function isNetworkError(error: unknown): boolean {
  // ApiError with status 0 indicates network error
  if (isApiError(error) && error.status === 0) {
    return true;
  }

  // AxiosError without response indicates network failure
  if (isAxiosError(error) && !error.response) {
    return true;
  }

  return false;
}

/**
 * Check if an error is retryable (server error or network failure).
 * Client errors (4xx) are not retryable as they indicate request issues.
 *
 * @param error - Unknown error to check
 * @returns True if the request should be retried
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors are retryable
  if (isNetworkError(error)) {
    return true;
  }

  const status = getErrorStatus(error);

  // No status means we couldn't determine - assume retryable
  if (status === undefined) {
    return true;
  }

  // 4xx errors are client errors - not retryable
  if (status >= 400 && status < 500) {
    return false;
  }

  // 5xx errors are server errors - retryable
  if (status >= 500) {
    return true;
  }

  // Other status codes (1xx, 2xx, 3xx shouldn't reach error handlers)
  return false;
}
