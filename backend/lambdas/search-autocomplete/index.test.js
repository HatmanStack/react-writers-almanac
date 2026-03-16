// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock the AWS SDK before anything else
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ Contents: [] }),
  })),
  ListObjectsV2Command: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

describe('search-autocomplete Lambda', () => {
  let handler;

  beforeAll(async () => {
    // Set required env var before importing
    process.env.S3_BUCKET = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    // Dynamic import after env and mocks are set up
    const mod = await import('./index.js');
    handler = mod.handler;
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
      // Should not return 400 with QUERY_TOO_LONG
      if (response.statusCode === 400) {
        const body = JSON.parse(response.body);
        expect(body.code).not.toBe('QUERY_TOO_LONG');
      }
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
