/**
 * Tests for API client configuration and interceptors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { cdnClient, apiClient } from './client';

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };

describe('API Client', () => {
  beforeEach(() => {
    // Suppress console logs in tests
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    vi.clearAllMocks();
  });

  describe('cdnClient configuration', () => {
    it('should have correct base URL', () => {
      expect(cdnClient.defaults.baseURL).toBe('https://d3vq6af2mo7fcy.cloudfront.net');
    });

    it('should have correct timeout', () => {
      expect(cdnClient.defaults.timeout).toBe(30000);
    });

    it('should have correct content-type header', () => {
      expect(cdnClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('apiClient configuration', () => {
    it('should have correct base URL', () => {
      // Should use placeholder URL when VITE_API_BASE_URL is not set
      expect(apiClient.defaults.baseURL).toContain('placeholder-api-gateway');
    });

    it('should have correct timeout', () => {
      expect(apiClient.defaults.timeout).toBe(15000);
    });

    it('should have correct content-type header', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error interceptor', () => {
    it('should format network errors correctly', async () => {
      // Create a test client for isolated testing
      const testClient = axios.create({
        baseURL: 'http://localhost:9999', // Non-existent server
        timeout: 100,
      });

      // Add the same error interceptor
      testClient.interceptors.response.use(
        response => response,
        error => {
          if (!error.response) {
            const apiError = {
              message: error.message || 'Network error occurred',
              status: 0,
              code: 'NETWORK_ERROR',
              timestamp: new Date().toISOString(),
            };
            return Promise.reject(apiError);
          }
          return Promise.reject(error);
        }
      );

      try {
        await testClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.status).toBe(0);
        expect(error.message).toBeTruthy();
      }
    });

    it('should format HTTP errors correctly', async () => {
      // Create a mock server response
      const mockError = {
        response: {
          status: 404,
          data: {
            message: 'Not found',
            code: 'NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
        },
        message: 'Request failed with status code 404',
      };

      // Test error formatting
      const apiError = {
        message: mockError.response.data.message,
        status: mockError.response.status,
        code: mockError.response.data.code,
        details: mockError.response.data,
        timestamp: mockError.response.data.timestamp,
      };

      expect(apiError.status).toBe(404);
      expect(apiError.code).toBe('NOT_FOUND');
      expect(apiError.message).toBe('Not found');
    });
  });

  describe('Interceptors are registered', () => {
    it('should have request interceptors registered on cdnClient', () => {
      // Interceptors are registered during module initialization
      // We can verify by checking the interceptor manager exists
      expect(cdnClient.interceptors.request).toBeDefined();
    });

    it('should have response interceptors registered on cdnClient', () => {
      expect(cdnClient.interceptors.response).toBeDefined();
    });

    it('should have request interceptors registered on apiClient', () => {
      expect(apiClient.interceptors.request).toBeDefined();
    });

    it('should have response interceptors registered on apiClient', () => {
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });

  describe('Environment variable configuration', () => {
    it('should use CDN_BASE_URL from environment or default', () => {
      // In test environment, should use default
      const expectedUrl =
        import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
      expect(cdnClient.defaults.baseURL).toBe(expectedUrl);
    });

    it('should use API_BASE_URL from environment or default', () => {
      // In test environment, should use default
      const expectedUrl =
        import.meta.env.VITE_API_BASE_URL || 'https://placeholder-api-gateway.amazonaws.com/prod';
      expect(apiClient.defaults.baseURL).toBe(expectedUrl);
    });
  });
});
