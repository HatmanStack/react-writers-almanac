/**
 * API Client Configuration
 *
 * Provides configured fetch wrappers for:
 * - CDN (CloudFront) - static content (poems, author files)
 * - API Gateway - dynamic endpoints (search)
 */

import type { ApiError } from '../types/api';

/**
 * Shape of error response data from API
 */
interface ApiErrorResponse {
  message?: string;
  code?: string;
  timestamp?: string;
}

// Environment variables
export const CDN_BASE_URL =
  import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://placeholder-api-gateway.amazonaws.com/prod';

async function request<T>(
  baseURL: string,
  path: string,
  options: RequestInit = {},
  timeout: number = 15000
): Promise<{ data: T }> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseURL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
      },
      // Compose, do not choose. This previously fell back from the caller's
      // signal to the timeout controller's, so supplying a signal handed fetch
      // the caller's alone and left the timeout armed but wired to nothing.
      // usePoemData always supplies one, so the primary content fetch had no
      // timeout at all: a hung connection left stale content on screen with no
      // error state and no path to one.
      signal: options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      const apiError: ApiError = {
        message: errorData?.message || response.statusText || 'An error occurred',
        status: response.status,
        code: errorData?.code || 'UNKNOWN_ERROR',
        details: errorData as Record<string, unknown>,
        timestamp: errorData?.timestamp || new Date().toISOString(),
      };
      throw apiError;
    }

    if (response.status === 204) {
      return { data: {} as T };
    }

    const data = await response.json();
    return { data };
  } catch (error: unknown) {
    clearTimeout(id);

    // A caller that aborts with a reason makes AbortSignal.any reject with that
    // reason rather than a DOMException, so testing only for AbortError would
    // misfile it as a network failure and clear the reader's poem -- the exact
    // harm H6 names. Treat an aborted caller signal as cancellation regardless
    // of what the rejection looks like.
    if (
      (error instanceof DOMException && error.name === 'AbortError') ||
      options.signal?.aborted === true ||
      controller.signal.aborted
    ) {
      // Which signal fired decides what this is, and the composed signal cannot
      // say: it aborts for either reason. `controller` belongs to the timeout
      // and nothing else aborts it, so `controller.signal.aborted` is true for
      // a timeout and false for a caller abort.
      //
      // The distinction is load-bearing. A caller abort means the reader moved
      // on, so the consumer should keep what is on screen; a timeout means the
      // load failed, so it must show that. Reporting both as TIMEOUT_ERROR made
      // usePoemData swallow a real timeout and leave a stale poem in place with
      // no error state — the harm health-audit H6 names.
      // The caller's own signal wins: if it aborted, the reader moved on, even
      // if the timeout fired in the same tick.
      const timedOut = controller.signal.aborted && options.signal?.aborted !== true;
      throw {
        message: timedOut ? `Request timed out after ${timeout}ms` : 'Request cancelled',
        status: 0,
        code: timedOut ? 'TIMEOUT_ERROR' : 'ABORT_ERROR',
        timestamp: new Date().toISOString(),
      } as ApiError;
    }

    if (typeof error === 'object' && error !== null && 'status' in error) {
      throw error;
    }

    throw {
      message: error instanceof Error ? error.message : 'Network error occurred',
      status: 0,
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    } as ApiError;
  }
}

export const cdnClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(CDN_BASE_URL, path, { ...options, method: 'GET' }, 10000),
};

export const apiClient = {
  get: <T>(path: string, options?: RequestInit) =>
    request<T>(API_BASE_URL, path, { ...options, method: 'GET' }, 15000),
  post: <T>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(API_BASE_URL, path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// Export configured clients
export default {
  cdn: cdnClient,
  api: apiClient,
};
