/**
 * Tests for useAuthorQuery hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthorQuery } from './useAuthorQuery';
import { cdnClient } from '../../api/client';
import type { Author } from '../../types/author';

// Mock the axios client
vi.mock('../../api/client', () => ({
  cdnClient: {
    get: vi.fn(),
  },
}));

const mockAuthorData: Author = {
  'poetry foundation': {
    poet_meta_data: {
      lifetime: '1941–',
      website: 'http://www.billycollins.com',
    },
    biography: 'Billy Collins was born in New York City...',
    photo: 'https://example.com/photo.jpg',
    poems: 'NotAvailable',
    source: 'Poetry Foundation',
    url: 'https://www.poetryfoundation.org/poets/billy-collins',
  },
};

describe('useAuthorQuery', () => {
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

  it('should fetch author data successfully by slug', async () => {
    vi.mocked(cdnClient.get).mockResolvedValueOnce({
      data: mockAuthorData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => useAuthorQuery('billy-collins'), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAuthorData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // Should use slug format in URL
    expect(cdnClient.get).toHaveBeenCalledWith('/authors/by-name/billy-collins.json');
  });

  it('should normalize author name to slug', async () => {
    vi.mocked(cdnClient.get).mockResolvedValueOnce({
      data: mockAuthorData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result } = renderHook(() => useAuthorQuery('Billy Collins'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should convert "Billy Collins" to "billy-collins"
    expect(cdnClient.get).toHaveBeenCalledWith('/authors/by-name/billy-collins.json');
  });

  it('should handle 404 error for non-existent author', async () => {
    const error = {
      message: 'Author not found',
      status: 404,
      code: 'AUTHOR_NOT_FOUND',
      timestamp: new Date().toISOString(),
    };

    vi.mocked(cdnClient.get).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAuthorQuery('unknown-author'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when name is empty', () => {
    const { result } = renderHook(() => useAuthorQuery(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(cdnClient.get).not.toHaveBeenCalled();
  });

  it('should cache author data for 24 hours', async () => {
    vi.mocked(cdnClient.get).mockResolvedValueOnce({
      data: mockAuthorData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const { result: result1 } = renderHook(() => useAuthorQuery('billy-collins'), { wrapper });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Second call with same author
    const { result: result2 } = renderHook(() => useAuthorQuery('billy-collins'), { wrapper });

    // Should return cached data
    expect(result2.current.data).toEqual(mockAuthorData);
    expect(result2.current.isLoading).toBe(false);

    // API called only once (second call uses cache)
    expect(cdnClient.get).toHaveBeenCalledTimes(1);
  });
});
