/**
 * usePoemData - Poem Data Fetching Hook
 *
 * Fetches poem JSON and audio data from CloudFront CDN.
 * Manages abort controllers for cleanup on unmount/re-fetch.
 */

import { useEffect } from 'react';
import axios from 'axios';
import { cdnClient, CDN_BASE_URL } from '../api/client';
import { CDN_ENDPOINTS, isAudioAvailable } from '../api/endpoints';
import { sanitizePoemText, sanitizePoemLines } from '../api/transforms';
import { useAppStore } from '../store/useAppStore';

/** Default transcript message when not available */
const TRANSCRIPT_UNAVAILABLE = 'Transcript not available for this date.';

interface PoemResponse {
  dayofweek?: string;
  date?: string;
  poembyline?: string;
  poem?: string | string[];
  poemtitle?: string | string[];
  author?: string | string[];
  notes?: string | string[];
  transcript?: string;
}

interface UsePoemDataOptions {
  /** Date to fetch in YYYYMMDD format */
  linkDate: string;
  /** Callback to set day of week */
  setDay: (day: string | undefined) => void;
  /** Callback to set poem byline */
  setPoemByline: (byline: string | undefined) => void;
}

/**
 * Hook to fetch poem data from CDN.
 *
 * Fetches both JSON metadata and MP3 audio for a given date.
 * Automatically cleans up pending requests on re-render or unmount.
 *
 * @param options - Fetch configuration
 *
 * @example
 * ```tsx
 * usePoemData({
 *   linkDate: '20150315',
 *   setDay,
 *   setPoemByline,
 * });
 * ```
 */
export function usePoemData({ linkDate, setDay, setPoemByline }: UsePoemDataOptions): void {
  // Get store actions
  const storeSetCurrentDate = useAppStore(state => state.setCurrentDate);
  const setPoemData = useAppStore(state => state.setPoemData);
  const setAuthorData = useAppStore(state => state.setAuthorData);
  const setAudioData = useAppStore(state => state.setAudioData);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchPoemData() {
      // Validate linkDate format
      if (!/^\d{8}$/.test(linkDate)) {
        return;
      }

      try {
        const response = await cdnClient.get<PoemResponse>(CDN_ENDPOINTS.getPoemByDate(linkDate), {
          signal: abortController.signal,
        });

        const data = response.data;

        // Update local component state
        setDay(data.dayofweek);
        storeSetCurrentDate(data.date);
        setPoemByline(data.poembyline);

        // Sanitize poem text - fix encoding issues via transforms layer
        let poem = data.poem;
        if (typeof poem === 'string') {
          poem = sanitizePoemText(poem);
        } else if (Array.isArray(poem)) {
          poem = sanitizePoemLines(poem);
        }

        // Update store with poem data
        setPoemData({
          poem,
          poemTitle: data.poemtitle,
          note: data.notes,
        });

        // Update store with author data
        setAuthorData({
          author: data.author,
        });

        // Update store with transcript (with fallback for missing data)
        const transcriptText =
          data.transcript && data.transcript.trim() ? data.transcript : TRANSCRIPT_UNAVAILABLE;

        setAudioData({
          transcript: transcriptText,
        });

        // Log warning if transcript is missing (for debugging)
        if (!data.transcript || !data.transcript.trim()) {
          // eslint-disable-next-line no-console
          console.warn(`[usePoemData] No transcript available for date: ${linkDate}`);
        }
      } catch (error) {
        // Don't update state if request was aborted
        if (axios.isCancel(error)) {
          return;
        }

        // Set fallback state to prevent undefined errors on fetch failure
        setPoemData({ poem: [], poemTitle: [], note: [] });
        setAuthorData({ author: [] });
        setAudioData({ transcript: TRANSCRIPT_UNAVAILABLE, mp3Url: 'NotAvailable' });
      }
    }

    function setAudioUrl() {
      // Audio only available after 2009-01-11
      if (!isAudioAvailable(linkDate)) {
        setAudioData({ mp3Url: 'NotAvailable' });
        return;
      }

      // Use direct CDN URL - browser handles streaming and range requests natively
      const directUrl = `${CDN_BASE_URL}${CDN_ENDPOINTS.getPoemAudio(linkDate)}`;
      setAudioData({ mp3Url: directUrl });
    }

    // Fetch poem data and set audio URL
    fetchPoemData();
    setAudioUrl();

    // Cleanup: abort pending requests when effect re-runs or component unmounts
    return () => {
      abortController.abort();
    };
  }, [
    linkDate,
    setDay,
    setPoemByline,
    storeSetCurrentDate,
    setPoemData,
    setAuthorData,
    setAudioData,
  ]);
}
