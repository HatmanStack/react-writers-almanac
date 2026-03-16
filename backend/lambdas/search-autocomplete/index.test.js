// @vitest-environment node
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';

describe('search-autocomplete Lambda', () => {
  let handler;
  let sendSpy;

  beforeAll(async () => {
    // Mock S3Client.prototype.send before the Lambda module loads and creates its client
    sendSpy = vi.spyOn(S3Client.prototype, 'send').mockResolvedValue({
      Contents: [],
      IsTruncated: false,
    });

    // Set required env var before importing
    process.env.S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    // Dynamic import after env and mocks are set up
    const mod = await import('./index.js');
    handler = mod.handler;
  });

  afterAll(() => {
    sendSpy?.mockRestore();
  });

  describe('query length validation', () => {
    it('should accept a query of 200 characters', async () => {
      const query = 'a'.repeat(200);
      const event = {
        httpMethod: 'GET',
        path: '/api/search/autocomplete',
        pathParameters: null,
        queryStringParameters: { q: query },
      };

      const response = await handler(event);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('results');
      expect(body).toHaveProperty('query', query);
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
