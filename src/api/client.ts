/**
 * API Client Configuration
 *
 * Provides configured axios instances for:
 * - CDN (CloudFront) - static content (poems, author files)
 * - API Gateway - dynamic endpoints (search)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://placeholder-api-gateway.amazonaws.com/prod';

/**
 * CDN Client (CloudFront)
 * For static content: daily poems, author data
 */
export const cdnClient: AxiosInstance = axios.create({
  baseURL: CDN_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Client (API Gateway)
 * For dynamic endpoints: search, etc.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Error interceptor - handle errors and format them consistently
 */
const errorInterceptor = (error: AxiosError): Promise<never> => {
  // Network error or timeout
  if (!error.response) {
    const apiError: ApiError = {
      message: error.message || 'Network error occurred',
      status: 0,
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(apiError);
  }

  // HTTP error response
  const errorData = error.response.data as ApiErrorResponse;
  const apiError: ApiError = {
    message: errorData?.message || error.message || 'An error occurred',
    status: error.response.status,
    code: errorData?.code || 'UNKNOWN_ERROR',
    details: error.response.data as Record<string, unknown>,
    timestamp: errorData?.timestamp || new Date().toISOString(),
  };

  return Promise.reject(apiError);
};

// Add error interceptor to clients
cdnClient.interceptors.response.use(response => response, errorInterceptor);
apiClient.interceptors.response.use(response => response, errorInterceptor);

// Export configured clients
export default {
  cdn: cdnClient,
  api: apiClient,
};
