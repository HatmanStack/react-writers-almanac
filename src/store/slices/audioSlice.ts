import type { AudioSlice, SliceCreator } from '../types';

/**
 * Audio Slice - Manages audio player state including MP3, transcript, and playback
 *
 * This slice handles all audio-related state including:
 * - MP3 URL (including blob URLs)
 * - Transcript text
 * - Playback state (playing/paused)
 * - Current playback time
 * - Cleanup for blob URLs
 */
export const createAudioSlice: SliceCreator<AudioSlice> = (set, get) => ({
  // ============================================================================
  // State
  // ============================================================================
  mp3Url: undefined,
  transcript: undefined,
  isPlaying: false,
  currentTime: 0,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set audio data (MP3 URL and/or transcript)
   * Accepts partial updates - only provided fields will be updated
   */
  setAudioData: data => {
    set({
      ...(data.mp3Url !== undefined && { mp3Url: data.mp3Url }),
      ...(data.transcript !== undefined && { transcript: data.transcript }),
    });
  },

  /**
   * Toggle playback state between playing and paused
   */
  togglePlayback: () => {
    set(state => ({
      isPlaying: !state.isPlaying,
    }));
  },

  /**
   * Set the current playback time in seconds
   */
  setCurrentTime: time => {
    set({ currentTime: time });
  },

  /**
   * Clean up audio resources
   * - Revokes blob URLs to free memory
   * - Resets all audio state to initial values
   */
  cleanup: () => {
    const state = get();

    // Revoke blob URL if it exists
    if (state.mp3Url && state.mp3Url.startsWith('blob:')) {
      URL.revokeObjectURL(state.mp3Url);
    }

    // Reset all audio state
    set({
      mp3Url: undefined,
      transcript: undefined,
      isPlaying: false,
      currentTime: 0,
    });
  },
});
