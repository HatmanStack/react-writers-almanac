import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createAudioSlice } from './audioSlice';
import type { AudioSlice } from '../types';

describe('AudioSlice', () => {
  let useTestStore: UseBoundStore<StoreApi<AudioSlice>>;

  // Mock URL.revokeObjectURL
  const mockRevokeObjectURL = vi.fn();
  const originalRevokeObjectURL = global.URL.revokeObjectURL;

  beforeEach(() => {
    // Create a fresh store for each test
    useTestStore = create<AudioSlice>()((set, get) => createAudioSlice(set as any, get as any));

    // Mock URL.revokeObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockRevokeObjectURL.mockClear();
  });

  afterEach(() => {
    // Restore original URL.revokeObjectURL
    global.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = useTestStore.getState();

      expect(state.mp3Url).toBeUndefined();
      expect(state.transcript).toBeUndefined();
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
    });
  });

  describe('setAudioData Action', () => {
    it('should set mp3Url and transcript', () => {
      const { setAudioData } = useTestStore.getState();

      setAudioData({
        mp3Url: 'https://example.com/audio.mp3',
        transcript: 'This is the transcript',
      });

      const state = useTestStore.getState();
      expect(state.mp3Url).toBe('https://example.com/audio.mp3');
      expect(state.transcript).toBe('This is the transcript');
    });

    it('should set only mp3Url when transcript is not provided', () => {
      const { setAudioData } = useTestStore.getState();

      setAudioData({
        mp3Url: 'https://example.com/audio.mp3',
      });

      const state = useTestStore.getState();
      expect(state.mp3Url).toBe('https://example.com/audio.mp3');
      expect(state.transcript).toBeUndefined();
    });

    it('should set only transcript when mp3Url is not provided', () => {
      const { setAudioData } = useTestStore.getState();

      setAudioData({
        transcript: 'Transcript only',
      });

      const state = useTestStore.getState();
      expect(state.mp3Url).toBeUndefined();
      expect(state.transcript).toBe('Transcript only');
    });

    it('should update existing audio data', () => {
      const { setAudioData } = useTestStore.getState();

      // Set initial data
      setAudioData({
        mp3Url: 'https://example.com/old.mp3',
        transcript: 'Old transcript',
      });

      // Update with new data
      setAudioData({
        mp3Url: 'https://example.com/new.mp3',
        transcript: 'New transcript',
      });

      const state = useTestStore.getState();
      expect(state.mp3Url).toBe('https://example.com/new.mp3');
      expect(state.transcript).toBe('New transcript');
    });

    it('should handle blob URLs', () => {
      const { setAudioData } = useTestStore.getState();

      const blobUrl = 'blob:https://example.com/123-456-789';
      setAudioData({
        mp3Url: blobUrl,
      });

      const state = useTestStore.getState();
      expect(state.mp3Url).toBe(blobUrl);
    });

    it('should handle empty object', () => {
      const { setAudioData } = useTestStore.getState();

      // Set initial data
      setAudioData({
        mp3Url: 'https://example.com/test.mp3',
      });

      // Update with empty object
      setAudioData({});

      // Should not change existing data
      const state = useTestStore.getState();
      expect(state.mp3Url).toBe('https://example.com/test.mp3');
    });
  });

  describe('togglePlayback Action', () => {
    it('should toggle from false to true', () => {
      const { togglePlayback } = useTestStore.getState();

      // Initial state should be false
      expect(useTestStore.getState().isPlaying).toBe(false);

      togglePlayback();

      expect(useTestStore.getState().isPlaying).toBe(true);
    });

    it('should toggle from true to false', () => {
      const { togglePlayback } = useTestStore.getState();

      // Toggle to true
      togglePlayback();
      expect(useTestStore.getState().isPlaying).toBe(true);

      // Toggle back to false
      togglePlayback();
      expect(useTestStore.getState().isPlaying).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { togglePlayback } = useTestStore.getState();

      togglePlayback(); // false -> true
      togglePlayback(); // true -> false
      togglePlayback(); // false -> true
      togglePlayback(); // true -> false

      expect(useTestStore.getState().isPlaying).toBe(false);
    });
  });

  describe('setCurrentTime Action', () => {
    it('should set current time to a positive number', () => {
      const { setCurrentTime } = useTestStore.getState();

      setCurrentTime(45.5);

      const state = useTestStore.getState();
      expect(state.currentTime).toBe(45.5);
    });

    it('should set current time to zero', () => {
      const { setCurrentTime } = useTestStore.getState();

      // Set to a non-zero value first
      setCurrentTime(100);
      expect(useTestStore.getState().currentTime).toBe(100);

      // Reset to zero
      setCurrentTime(0);
      expect(useTestStore.getState().currentTime).toBe(0);
    });

    it('should update current time multiple times', () => {
      const { setCurrentTime } = useTestStore.getState();

      setCurrentTime(10);
      expect(useTestStore.getState().currentTime).toBe(10);

      setCurrentTime(20);
      expect(useTestStore.getState().currentTime).toBe(20);

      setCurrentTime(30);
      expect(useTestStore.getState().currentTime).toBe(30);
    });

    it('should handle decimal values', () => {
      const { setCurrentTime } = useTestStore.getState();

      setCurrentTime(12.345);

      expect(useTestStore.getState().currentTime).toBe(12.345);
    });
  });

  describe('cleanup Action', () => {
    it('should revoke blob URL when mp3Url is a blob', () => {
      const { setAudioData, cleanup } = useTestStore.getState();

      const blobUrl = 'blob:https://example.com/123-456-789';
      setAudioData({ mp3Url: blobUrl });

      cleanup();

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(blobUrl);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('should not revoke non-blob URLs', () => {
      const { setAudioData, cleanup } = useTestStore.getState();

      const httpUrl = 'https://example.com/audio.mp3';
      setAudioData({ mp3Url: httpUrl });

      cleanup();

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should handle cleanup when mp3Url is undefined', () => {
      const { cleanup } = useTestStore.getState();

      // mp3Url is undefined by default
      cleanup();

      expect(mockRevokeObjectURL).not.toHaveBeenCalled();
    });

    it('should clear audio data after cleanup', () => {
      const { setAudioData, cleanup } = useTestStore.getState();

      setAudioData({
        mp3Url: 'blob:https://example.com/123',
        transcript: 'Test transcript',
      });

      cleanup();

      const state = useTestStore.getState();
      expect(state.mp3Url).toBeUndefined();
      expect(state.transcript).toBeUndefined();
    });

    it('should reset playback state after cleanup', () => {
      const { setAudioData, togglePlayback, setCurrentTime, cleanup } = useTestStore.getState();

      // Set up audio and playback state
      setAudioData({ mp3Url: 'blob:test' });
      togglePlayback(); // Set to playing
      setCurrentTime(50);

      // Verify state before cleanup
      let state = useTestStore.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.currentTime).toBe(50);

      // Cleanup
      cleanup();

      // Verify state is reset
      state = useTestStore.getState();
      expect(state.mp3Url).toBeUndefined();
      expect(state.transcript).toBeUndefined();
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
    });

    it('should be safe to call cleanup multiple times', () => {
      const { setAudioData, cleanup } = useTestStore.getState();

      setAudioData({ mp3Url: 'blob:test' });

      cleanup();
      cleanup();
      cleanup();

      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1); // Only called once for the blob URL
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete audio playback workflow', () => {
      const { setAudioData, togglePlayback, setCurrentTime, cleanup } = useTestStore.getState();

      // Step 1: Load audio
      setAudioData({
        mp3Url: 'blob:https://example.com/audio',
        transcript: 'Full transcript',
      });
      let state = useTestStore.getState();
      expect(state.mp3Url).toBe('blob:https://example.com/audio');

      // Step 2: Start playback
      togglePlayback();
      state = useTestStore.getState();
      expect(state.isPlaying).toBe(true);

      // Step 3: Update time during playback
      setCurrentTime(25.5);
      state = useTestStore.getState();
      expect(state.currentTime).toBe(25.5);

      // Step 4: Pause
      togglePlayback();
      state = useTestStore.getState();
      expect(state.isPlaying).toBe(false);

      // Step 5: Resume
      togglePlayback();
      state = useTestStore.getState();
      expect(state.isPlaying).toBe(true);

      // Step 6: Clean up when done
      cleanup();
      state = useTestStore.getState();
      expect(state.mp3Url).toBeUndefined();
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:https://example.com/audio');
    });

    it('should maintain action references after state updates', () => {
      const { setAudioData, togglePlayback } = useTestStore.getState();

      // Use first reference
      setAudioData({ mp3Url: 'test.mp3' });
      togglePlayback();

      // Get actions again
      const { setAudioData: setAudioData2, setCurrentTime: setCurrentTime2 } =
        useTestStore.getState();

      // Actions should still work
      setAudioData2({ transcript: 'Updated' });
      setCurrentTime2(100);

      const state = useTestStore.getState();
      expect(state.transcript).toBe('Updated');
      expect(state.currentTime).toBe(100);
    });
  });
});
