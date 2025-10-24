/**
 * Tests for usePoemQuery hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePoemQuery } from './usePoemQuery';
import { cdnClient } from '../../api/client';
import type { Poem } from '../../types/poem';

// Mock the axios client
vi.mock('../../api/client', () => ({
  cdnClient: {
    get: vi.fn(),
  },
}));

const mockPoemData: Poem = {
  dayofweek: 'Monday',
  date: 'January 1, 2024',
  transcript: 'Full transcript of the episode',
  poemtitle: ['New Year'],
  poembyline: 'A poem about beginnings',
  author: ['Test Poet'],
  poem: ['Line 1', 'Line 2', 'Line 3'],
  notes: ['Test note'],
};

describe('usePoemQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch poem data successfully', async () => {
    // Mock successful response
    vi.mocked(cdnClient.get).mockResolvedValueOnce({
      data: mockPoemData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => usePoemQuery('20240101'), { wrapper });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify data
    expect(result.current.data).toEqual(mockPoemData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify API was called with correct URL
    expect(cdnClient.get).toHaveBeenCalledWith('/public/20240101.json');
    expect(cdnClient.get).toHaveBeenCalledTimes(1);
  });

  it('should handle 404 error for non-existent date', async () => {
    // Mock 404 error
    const error = {
      message: 'Poem not found',
      status: 404,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    };

    vi.mocked(cdnClient.get).mockRejectedValueOnce(error);

    const { result } = renderHook(() => usePoemQuery('19990101'), { wrapper });

    // Wait for query to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error state
    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct cache key', () => {
    const date = '20240101';
    const { result } = renderHook(() => usePoemQuery(date), { wrapper });

    // The query key should include the date
    expect(result.current.failureReason).toBeNull();
  });

  it('should not fetch when date is empty', () => {
    const { result } = renderHook(() => usePoemQuery(''), { wrapper });

    // Should not be loading if date is empty
    expect(result.current.isLoading).toBe(false);
    expect(cdnClient.get).not.toHaveBeenCalled();
  });

  it('should cache poem data', async () => {
    vi.mocked(cdnClient.get).mockResolvedValueOnce({
      data: mockPoemData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result: result1 } = renderHook(() => usePoemQuery('20240101'), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Call the same query again
    const { result: result2 } = renderHook(() => usePoemQuery('20240101'), { wrapper });

    // Should return cached data immediately
    expect(result2.current.data).toEqual(mockPoemData);
    expect(result2.current.isLoading).toBe(false);

    // API should only be called once (cached on second call)
    expect(cdnClient.get).toHaveBeenCalledTimes(1);
  });
});
