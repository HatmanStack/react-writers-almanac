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
   * Automatically revokes old blob URLs to prevent memory leaks
   */
  setAudioData: data => {
    set(state => {
      // Revoke old blob URL if being replaced with new mp3Url
      if (data.mp3Url !== undefined && state.mp3Url && state.mp3Url.startsWith('blob:')) {
        URL.revokeObjectURL(state.mp3Url);
      }

      return {
        ...state,
        ...(data.mp3Url !== undefined && { mp3Url: data.mp3Url }),
        ...(data.transcript !== undefined && { transcript: data.transcript }),
      };
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
   * Clamps value to be >= 0 (negative playback time doesn't make sense)
   */
  setCurrentTime: time => {
    set({ currentTime: Math.max(0, time) });
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
