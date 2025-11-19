import { describe, it, expect, beforeEach } from 'vitest';
import { create, type StoreApi, type UseBoundStore, type StateCreator } from 'zustand';
import { createAudioSlice } from './audioSlice';
import type { AudioSlice } from '../types';

/**
 * Integration test for transcript bug fix
 *
 * This test verifies the fix for the issue where transcript content
 * was being lost when mp3Url was set separately after transcript.
 *
 * Bug: setAudioData was not preserving existing state when updating
 * Fix: Added ...state spread operator to preserve all fields
 */
describe('Transcript Integration Test - Bug Fix Verification', () => {
  let useTestStore: UseBoundStore<StoreApi<AudioSlice>>;

  beforeEach(() => {
    // Create a fresh store for each test
    // Cast to StateCreator for isolated testing (slices normally access AppStore)
    const sliceCreator: StateCreator<AudioSlice> =
      createAudioSlice as unknown as StateCreator<AudioSlice>;
    useTestStore = create(sliceCreator);
  });

  it('should preserve transcript when set before mp3Url (reproduces original bug scenario)', () => {
    const { setAudioData } = useTestStore.getState();

    // Step 1: Set transcript first (like App.tsx line 315-317)
    // This is what happens when poem data is loaded
    setAudioData({
      transcript: 'Today is the birthday of J.R.R. Tolkien (1892)...',
    });

    // Verify transcript is set
    let state = useTestStore.getState();
    expect(state.transcript).toBe('Today is the birthday of J.R.R. Tolkien (1892)...');
    expect(state.mp3Url).toBeUndefined();

    // Step 2: Set mp3Url separately (like App.tsx line 341)
    // This happens after audio file is fetched and converted to blob URL
    setAudioData({
      mp3Url: 'blob:https://example.com/audio.mp3',
    });

    // CRITICAL: Both transcript and mp3Url should be present
    // Before fix: transcript would be lost here
    // After fix: transcript is preserved
    state = useTestStore.getState();
    expect(state.transcript).toBe('Today is the birthday of J.R.R. Tolkien (1892)...');
    expect(state.mp3Url).toBe('blob:https://example.com/audio.mp3');
  });

  it('should handle error fallback message for missing transcript', () => {
    const { setAudioData } = useTestStore.getState();

    // Simulate App.tsx error handling - fallback message for missing transcript
    const transcriptText = 'Transcript not available for this date.';

    setAudioData({
      transcript: transcriptText,
    });

    const state = useTestStore.getState();
    expect(state.transcript).toBe('Transcript not available for this date.');
  });

  it('should handle multiple updates preserving all audio state', () => {
    const { setAudioData, togglePlayback, setCurrentTime } = useTestStore.getState();

    // Set transcript
    setAudioData({
      transcript: 'Full transcript text',
    });

    // Set mp3Url
    setAudioData({
      mp3Url: 'https://example.com/audio.mp3',
    });

    // User starts playing
    togglePlayback();
    setCurrentTime(15.5);

    // Update transcript (e.g., user navigates to different date)
    setAudioData({
      transcript: 'Updated transcript for new date',
    });

    // All state should be preserved
    const state = useTestStore.getState();
    expect(state.transcript).toBe('Updated transcript for new date');
    expect(state.mp3Url).toBe('https://example.com/audio.mp3');
    expect(state.isPlaying).toBe(true);
    expect(state.currentTime).toBe(15.5);
  });

  it('should handle empty string transcript as error case', () => {
    const { setAudioData } = useTestStore.getState();

    // Simulate App.tsx handling empty transcript
    const transcriptText = '' || 'Transcript not available for this date.';

    setAudioData({
      transcript: transcriptText,
    });

    const state = useTestStore.getState();
    expect(state.transcript).toBe('Transcript not available for this date.');
  });

  it('should handle undefined transcript as error case', () => {
    const { setAudioData } = useTestStore.getState();

    // Simulate App.tsx handling undefined transcript
    const dataTranscript: string | undefined = undefined;
    const transcriptText =
      dataTranscript && dataTranscript.trim()
        ? dataTranscript
        : 'Transcript not available for this date.';

    setAudioData({
      transcript: transcriptText,
    });

    const state = useTestStore.getState();
    expect(state.transcript).toBe('Transcript not available for this date.');
  });

  it('should handle whitespace-only transcript as error case', () => {
    const { setAudioData } = useTestStore.getState();

    // Simulate App.tsx handling whitespace-only transcript
    const dataTranscript = '   \n\t  ';
    const transcriptText =
      dataTranscript && dataTranscript.trim()
        ? dataTranscript
        : 'Transcript not available for this date.';

    setAudioData({
      transcript: transcriptText,
    });

    const state = useTestStore.getState();
    expect(state.transcript).toBe('Transcript not available for this date.');
  });
});
