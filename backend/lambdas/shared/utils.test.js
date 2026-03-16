// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { Readable } from 'stream';
import { getCorsHeaders, errorResponse, streamToString } from './utils.js';

describe('shared Lambda utilities', () => {
  describe('getCorsHeaders', () => {
    it('should return headers with Access-Control-Allow-Origin: *', () => {
      const headers = getCorsHeaders();
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should return headers with correct methods', () => {
      const headers = getCorsHeaders();
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, OPTIONS');
    });

    it('should return headers with Content-Type application/json', () => {
      const headers = getCorsHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should return headers with Cache-Control', () => {
      const headers = getCorsHeaders();
      expect(headers['Cache-Control']).toBe('public, max-age=3600');
    });
  });

  describe('errorResponse', () => {
    it('should return correct shape with statusCode, headers, and JSON body', () => {
      const response = errorResponse(400, 'test message', 'TEST_CODE');
      expect(response.statusCode).toBe(400);
      expect(response.headers).toBeDefined();
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');

      const body = JSON.parse(response.body);
      expect(body.message).toBe('test message');
      expect(body.status).toBe(400);
      expect(body.code).toBe('TEST_CODE');
      expect(body.timestamp).toBeDefined();
    });

    it('should allow header overrides', () => {
      const response = errorResponse(500, 'error', 'ERR', {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate');
      // Other CORS headers should still be present
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should use non-cacheable Cache-Control by default', () => {
      const response = errorResponse(404, 'not found', 'NOT_FOUND');
      expect(response.headers['Cache-Control']).toBe('no-store, no-cache, must-revalidate, max-age=0');
    });

    it('should allow callers to override Cache-Control', () => {
      const response = errorResponse(503, 'retry later', 'RETRY', {
        'Cache-Control': 'private, no-cache, max-age=0',
      });
      expect(response.headers['Cache-Control']).toBe('private, no-cache, max-age=0');
    });
  });

  describe('streamToString', () => {
    it('should convert a readable stream to string', async () => {
      const stream = Readable.from([Buffer.from('hello'), Buffer.from(' '), Buffer.from('world')]);
      const result = await streamToString(stream);
      expect(result).toBe('hello world');
    });

    it('should handle empty stream', async () => {
      const stream = Readable.from([]);
      const result = await streamToString(stream);
      expect(result).toBe('');
    });

    it('should handle stream with Buffer chunks', async () => {
      const stream = Readable.from([Buffer.from('test data')]);
      const result = await streamToString(stream);
      expect(result).toBe('test data');
    });
  });
});
