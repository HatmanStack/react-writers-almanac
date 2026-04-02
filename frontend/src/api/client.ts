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
export const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
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
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: options.signal || controller.signal,
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

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw {
        message: 'Request timeout or cancelled',
        status: 0,
        code: 'TIMEOUT_ERROR',
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
