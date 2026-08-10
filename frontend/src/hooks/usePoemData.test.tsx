/**
 * Tests for usePoemData — specifically the aborted-request guard.
 *
 * The client throws plain object literals cast to ApiError, never Error
 * instances, so the guard has to test the error's shape. See client.ts:76,88.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePoemData } from './usePoemData';
import { cdnClient } from '../api/client';
import { useAppStore } from '../store/useAppStore';

vi.mock('../api/client', () => ({
  cdnClient: { get: vi.fn() },
  CDN_BASE_URL: 'https://cdn.test',
}));

const mockGet = vi.mocked(cdnClient.get);

/** The exact literal client.ts:76 throws when a request aborts or times out. */
const TIMEOUT_REJECTION = {
  message: 'Request timeout or cancelled',
  status: 0,
  code: 'TIMEOUT_ERROR',
  timestamp: '2026-08-09T00:00:00.000Z',
};

/** The exact literal client.ts:88 throws for a genuine transport failure. */
const NETWORK_REJECTION = {
  message: 'Network error occurred',
  status: 0,
  code: 'NETWORK_ERROR',
  timestamp: '2026-08-09T00:00:00.000Z',
};

const RENDERED_POEM = ['The first line', 'The second line'];
const RENDERED_TITLE = ['A Poem Already On Screen'];
const RENDERED_AUTHOR = ['A Poet'];
const RENDERED_NOTE = ['A note about the poem'];
const RENDERED_TRANSCRIPT = 'A transcript already on screen';

/** Put the store in the state it would be in after a poem has rendered. */
function seedRenderedPoem(): void {
  const store = useAppStore.getState();
  store.setPoemData({
    poem: RENDERED_POEM,
    poemTitle: RENDERED_TITLE,
    note: RENDERED_NOTE,
  });
  store.setAuthorData({ author: RENDERED_AUTHOR });
  store.setAudioData({ transcript: RENDERED_TRANSCRIPT });
}

function renderPoemHook(linkDate = '20150315') {
  return renderHook(() => usePoemData({ linkDate, setDay: vi.fn(), setPoemByline: vi.fn() }));
}

/**
 * Wait for the rejection to have been handled.
 *
 * Both tests below use the identical wait, which is what makes the pair
 * meaningful: the NETWORK_ERROR test asserts state *did* change, so it fails
 * if this wait is ever too short to see the catch block run.
 */
async function settle(): Promise<void> {
  await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('usePoemData — aborted-request guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const store = useAppStore.getState();
    store.resetContent();
    store.cleanup();
  });

  afterEach(() => {
    const store = useAppStore.getState();
    store.resetContent();
    store.cleanup();
  });

  it('leaves rendered content alone when the request is aborted', async () => {
    seedRenderedPoem();
    mockGet.mockRejectedValue(TIMEOUT_REJECTION);

    renderPoemHook();
    await settle();

    const state = useAppStore.getState();
    expect(state.poem).toEqual(RENDERED_POEM);
    expect(state.poemTitle).toEqual(RENDERED_TITLE);
    expect(state.author).toEqual(RENDERED_AUTHOR);
    expect(state.note).toEqual(RENDERED_NOTE);
    expect(state.transcript).toBe(RENDERED_TRANSCRIPT);
    expect(state.mp3Url).not.toBe('NotAvailable');
  });

  it('writes the empty fallback state on a genuine network failure', async () => {
    seedRenderedPoem();
    mockGet.mockRejectedValue(NETWORK_REJECTION);

    renderPoemHook();
    await settle();

    const state = useAppStore.getState();
    expect(state.poem).toEqual([]);
    expect(state.poemTitle).toEqual([]);
    expect(state.author).toEqual([]);
    expect(state.note).toEqual([]);
    expect(state.transcript).toBe('Transcript not available for this date.');
    expect(state.mp3Url).toBe('NotAvailable');
  });

  it('still populates the store on a successful fetch', async () => {
    mockGet.mockResolvedValue({
      data: {
        dayofweek: 'Sunday',
        date: 'March 15, 2015',
        poem: 'A single line',
        poemtitle: 'The Title',
        author: 'The Poet',
        notes: 'The note',
        transcript: 'The transcript',
      },
    });

    renderPoemHook();
    await settle();

    const state = useAppStore.getState();
    expect(state.poem).toEqual(['A single line']);
    expect(state.poemTitle).toEqual(['The Title']);
    expect(state.author).toEqual(['The Poet']);
    expect(state.transcript).toBe('The transcript');
  });
});
