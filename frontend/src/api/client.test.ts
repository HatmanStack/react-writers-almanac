/**
 * Tests for fetch-based API client configuration and error handling
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cdnClient, apiClient, CDN_BASE_URL } from './client';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('cdnClient', () => {
    it('should have a get method', () => {
      expect(typeof cdnClient.get).toBe('function');
    });

    it('should call fetch with CDN base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ title: 'Test Poem' }),
      });

      await cdnClient.get('/poems/today.json');

      expect(mockFetch).toHaveBeenCalledWith(
        `${CDN_BASE_URL}/poems/today.json`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should return data wrapper from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ title: 'Test Poem' }),
      });

      const result = await cdnClient.get<{ title: string }>('/poems/today.json');
      expect(result.data).toEqual({ title: 'Test Poem' });
    });
  });

  describe('apiClient', () => {
    it('should have get and post methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
    });

    it('should call fetch with API base URL for GET', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [] }),
      });

      await apiClient.get('/search?q=test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?q=test'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call fetch with POST method and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await apiClient.post('/submit', { query: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/submit'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test' }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should format HTTP errors with response body details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          message: 'Not found',
          code: 'NOT_FOUND',
          timestamp: '2026-01-01T00:00:00.000Z',
        }),
      });

      try {
        await apiClient.get('/missing');
        expect.fail('Should have thrown error');
      } catch (error) {
        const apiError = error as { code: string; status: number; message: string };
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe('NOT_FOUND');
        expect(apiError.message).toBe('Not found');
      }
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('not json');
        },
      });

      try {
        await apiClient.get('/broken');
        expect.fail('Should have thrown error');
      } catch (error) {
        const apiError = error as { code: string; status: number; message: string };
        expect(apiError.status).toBe(500);
        expect(apiError.code).toBe('UNKNOWN_ERROR');
        expect(apiError.message).toBe('Internal Server Error');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await apiClient.get('/test');
        expect.fail('Should have thrown error');
      } catch (error) {
        const apiError = error as { code: string; status: number; message: string };
        expect(apiError.code).toBe('NETWORK_ERROR');
        expect(apiError.status).toBe(0);
        expect(apiError.message).toBe('Failed to fetch');
      }
    });

    it('should handle 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.get('/empty');
      expect(result.data).toEqual({});
    });
  });

  describe('Environment variable configuration', () => {
    it('should use CDN_BASE_URL from environment or default', () => {
      const expectedUrl =
        import.meta.env.VITE_CDN_BASE_URL || 'https://d3vq6af2mo7fcy.cloudfront.net';
      expect(CDN_BASE_URL).toBe(expectedUrl);
    });
  });

  describe('Request timeout', () => {
    const CDN_TIMEOUT_MS = 10000;

    /**
     * A fetch stand-in that behaves like the real one with respect to signals:
     * it stays pending forever and only settles — with an AbortError — when the
     * signal it was handed aborts. A mock that ignores `init.signal` cannot
     * observe whether the client wired the timeout up to anything.
     */
    function pendingUntilAborted(init?: RequestInit): Promise<never> {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        const fail = () => reject(new DOMException('The operation was aborted.', 'AbortError'));

        if (!signal) return;
        if (signal.aborted) {
          fail();
          return;
        }
        signal.addEventListener('abort', fail);
      });
    }

    it('times out when the caller supplies no signal', async () => {
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => pendingUntilAborted(init));

      const assertion = expect(cdnClient.get('/poems/today.json')).rejects.toMatchObject({
        code: 'TIMEOUT_ERROR',
        status: 0,
      });

      await vi.advanceTimersByTimeAsync(CDN_TIMEOUT_MS);
      await assertion;
    });

    it('still times out when the caller supplies its own signal', async () => {
      // The regression: `signal: options.signal || controller.signal` handed
      // fetch the caller's signal and left the armed timeout wired to nothing.
      // usePoemData always supplies a signal, so the primary content fetch had
      // no timeout at all.
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => pendingUntilAborted(init));

      const caller = new AbortController();
      const assertion = expect(
        cdnClient.get('/poems/today.json', { signal: caller.signal })
      ).rejects.toMatchObject({
        code: 'TIMEOUT_ERROR',
        status: 0,
      });

      await vi.advanceTimersByTimeAsync(CDN_TIMEOUT_MS);
      await assertion;
      expect(caller.signal.aborted).toBe(false);
    });

    it('rejects at the caller abort rather than waiting for the timeout', async () => {
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => pendingUntilAborted(init));

      const caller = new AbortController();
      const started = Date.now();
      let elapsed = -1;

      const promise = cdnClient.get('/poems/today.json', { signal: caller.signal }).catch(error => {
        elapsed = Date.now() - started;
        throw error;
      });
      const assertion = expect(promise).rejects.toMatchObject({ code: 'ABORT_ERROR' });

      await vi.advanceTimersByTimeAsync(1000);
      caller.abort();
      await assertion;

      expect(elapsed).toBe(1000);
    });

    it('reports a caller abort and a timeout under different codes', async () => {
      // Both paths reject with a DOMException named AbortError, so the code is
      // the only thing a consumer can use to tell "the reader navigated away"
      // from "the connection hung". usePoemData swallows the first — it must
      // not blank a poem that is already on screen — and surfaces the second.
      // Collapsing both into TIMEOUT_ERROR meant a hung connection timed out,
      // hit that guard, and left stale content on screen with no error state.
      mockFetch.mockImplementation((_url: string, init?: RequestInit) => pendingUntilAborted(init));

      const caller = new AbortController();
      const cancelled = cdnClient.get('/poems/today.json', { signal: caller.signal });
      const cancelledAssertion = expect(cancelled).rejects.toMatchObject({
        code: 'ABORT_ERROR',
        status: 0,
      });
      caller.abort();
      await cancelledAssertion;

      const hung = cdnClient.get('/poems/tomorrow.json');
      const hungAssertion = expect(hung).rejects.toMatchObject({
        code: 'TIMEOUT_ERROR',
        status: 0,
      });
      await vi.advanceTimersByTimeAsync(CDN_TIMEOUT_MS);
      await hungAssertion;
    });

    it('hands fetch a composed signal, not the caller signal itself', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ title: 'Test Poem' }),
      });

      const caller = new AbortController();
      await cdnClient.get('/poems/today.json', { signal: caller.signal });

      const passedSignal = mockFetch.mock.calls[0][1].signal as AbortSignal;
      expect(passedSignal).toBeInstanceOf(AbortSignal);
      expect(passedSignal).not.toBe(caller.signal);
    });

    it('resolves normally when a caller signal is supplied and fetch succeeds', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ title: 'Test Poem' }),
      });

      const caller = new AbortController();
      const result = await cdnClient.get<{ title: string }>('/poems/today.json', {
        signal: caller.signal,
      });

      expect(result.data).toEqual({ title: 'Test Poem' });
    });
  });
});
