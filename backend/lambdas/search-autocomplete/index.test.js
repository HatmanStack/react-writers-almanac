// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';

describe('search-autocomplete Lambda', () => {
  let handler;

  beforeAll(async () => {
    // Set required env var before importing
    process.env.S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    // Dynamic import after env is set up
    const mod = await import('./index.js');
    handler = mod.handler;
  });

  describe('query length validation', () => {
    it('should not reject a query of 200 characters as too long', async () => {
      const query = 'a'.repeat(200);
      const event = {
        httpMethod: 'GET',
        path: '/api/search/autocomplete',
        pathParameters: null,
        queryStringParameters: { q: query },
      };

      const response = await handler(event);
      // Must pass the length validation gate (not rejected as QUERY_TOO_LONG)
      const body = JSON.parse(response.body);
      expect(body.code).not.toBe('QUERY_TOO_LONG');
    });

    it('should reject a query of 201 characters with 400 error', async () => {
      const query = 'a'.repeat(201);
      const event = {
        httpMethod: 'GET',
        path: '/api/search/autocomplete',
        pathParameters: null,
        queryStringParameters: { q: query },
      };

      const response = await handler(event);
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('QUERY_TOO_LONG');
      expect(body.message).toBe('Query too long (max 200 characters)');
    });
  });
});
