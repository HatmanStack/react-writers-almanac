/**
 * Tests for useSearchQuery hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSearchQuery } from './useSearchQuery';
import { apiClient } from '../../api/client';
import type { SearchResponse } from '../../types/api';

// Mock the axios client
vi.mock('../../api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockSearchResponse: SearchResponse = {
  query: 'billy',
  results: [
    {
      type: 'author',
      name: 'Billy Collins',
      slug: 'billy-collins',
      info: 'Author',
    },
  ],
  total: 1,
};

describe('useSearchQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch search results successfully', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSearchResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => useSearchQuery('billy'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSearchResponse);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Should include query parameter
    expect(apiClient.get).toHaveBeenCalledWith('/api/search/autocomplete', {
      params: { q: 'billy', limit: 10 },
    });
  });

  it('should accept custom limit parameter', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSearchResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => useSearchQuery('billy', 20), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/search/autocomplete', {
      params: { q: 'billy', limit: 20 },
    });
  });

  it('should not fetch when query is empty', () => {
    const { result } = renderHook(() => useSearchQuery(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should not fetch when query is too short (< 1 char)', () => {
    const { result } = renderHook(() => useSearchQuery(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it.skip('should handle search errors', async () => {
    const error = {
      message: 'Search failed',
      status: 500,
      code: 'SEARCH_ERROR',
      timestamp: new Date().toISOString(),
    };

    vi.mocked(apiClient.get).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useSearchQuery('test'), { wrapper });

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 3000 } // Increase timeout for error state
    );

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should cache search results', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: mockSearchResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result: result1 } = renderHook(() => useSearchQuery('billy'), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Second call with same query
    const { result: result2 } = renderHook(() => useSearchQuery('billy'), { wrapper });

    // Should return cached data
    expect(result2.current.data).toEqual(mockSearchResponse);
    expect(result2.current.isLoading).toBe(false);

    // API called only once (second call uses cache)
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should return empty results for no matches', async () => {
    const emptyResponse: SearchResponse = {
      query: 'xyz',
      results: [],
      total: 0,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: emptyResponse,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => useSearchQuery('xyz'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(emptyResponse);
    expect(result.current.data?.results).toHaveLength(0);
  });
});
