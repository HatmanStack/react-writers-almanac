import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';
import type { SearchResult } from './types';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useAppStore.getState();
    store.resetContent();
    store.clearSearch();
    store.cleanup();
  });

  describe('Store Structure', () => {
    it('should combine all slices into a single store', () => {
      const state = useAppStore.getState();

      // Content slice properties
      expect(state).toHaveProperty('currentDate');
      expect(state).toHaveProperty('poem');
      expect(state).toHaveProperty('poemTitle');
      expect(state).toHaveProperty('author');
      expect(state).toHaveProperty('note');
      expect(state).toHaveProperty('isShowingContentByDate');
      expect(state).toHaveProperty('setCurrentDate');
      expect(state).toHaveProperty('setPoemData');
      expect(state).toHaveProperty('setAuthorData');
      expect(state).toHaveProperty('toggleViewMode');
      expect(state).toHaveProperty('resetContent');

      // Search slice properties
      expect(state).toHaveProperty('searchTerm');
      expect(state).toHaveProperty('searchResults');
      expect(state).toHaveProperty('isSearching');
      expect(state).toHaveProperty('setSearchTerm');
      expect(state).toHaveProperty('setSearchResults');
      expect(state).toHaveProperty('clearSearch');

      // Audio slice properties
      expect(state).toHaveProperty('mp3Url');
      expect(state).toHaveProperty('transcript');
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('currentTime');
      expect(state).toHaveProperty('setAudioData');
      expect(state).toHaveProperty('togglePlayback');
      expect(state).toHaveProperty('setCurrentTime');
      expect(state).toHaveProperty('cleanup');
    });

    it('should have correct initial state from all slices', () => {
      const state = useAppStore.getState();

      // Content slice initial state
      expect(state.currentDate).toBeUndefined();
      expect(state.poem).toBeUndefined();
      expect(state.poemTitle).toBeUndefined();
      expect(state.author).toBeUndefined();
      expect(state.note).toBeUndefined();
      expect(state.isShowingContentByDate).toBe(true);

      // Search slice initial state
      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.isSearching).toBe(false);

      // Audio slice initial state
      expect(state.mp3Url).toBeUndefined();
      expect(state.transcript).toBeUndefined();
      expect(state.isPlaying).toBe(false);
      expect(state.currentTime).toBe(0);
    });
  });

  describe('Content Slice Integration', () => {
    it('should execute content slice actions correctly', () => {
      const { setCurrentDate, setPoemData, setAuthorData } = useAppStore.getState();

      setCurrentDate('2024-01-15');
      setPoemData({
        poem: ['Line 1', 'Line 2'],
        poemTitle: ['Test Poem'],
        note: ['Note'],
      });
      setAuthorData({ author: ['John Doe'] });

      const state = useAppStore.getState();
      expect(state.currentDate).toBe('2024-01-15');
      expect(state.poem).toEqual(['Line 1', 'Line 2']);
      expect(state.poemTitle).toEqual(['Test Poem']);
      expect(state.author).toEqual(['John Doe']);
    });

    it('should toggle view mode', () => {
      const { toggleViewMode } = useAppStore.getState();

      expect(useAppStore.getState().isShowingContentByDate).toBe(true);
      toggleViewMode();
      expect(useAppStore.getState().isShowingContentByDate).toBe(false);
    });

    it('should reset content', () => {
      const { setCurrentDate, setPoemData, resetContent } = useAppStore.getState();

      setCurrentDate('2024-01-15');
      setPoemData({ poem: ['Test'] });

      resetContent();

      const state = useAppStore.getState();
      expect(state.currentDate).toBeUndefined();
      expect(state.poem).toBeUndefined();
    });
  });

  describe('Search Slice Integration', () => {
    it('should execute search slice actions correctly', () => {
      const { setSearchTerm, setSearchResults } = useAppStore.getState();

      setSearchTerm('test query');

      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Result',
          content: 'Content',
          type: 'poem',
        },
      ];
      setSearchResults(mockResults);

      const state = useAppStore.getState();
      expect(state.searchTerm).toBe('test query');
      expect(state.searchResults).toEqual(mockResults);
    });

    it('should clear search', () => {
      const { setSearchTerm, setSearchResults, clearSearch } = useAppStore.getState();

      setSearchTerm('test');
      setSearchResults([{ id: '1', title: 'T', content: 'C', type: 'poem' }]);

      clearSearch();

      const state = useAppStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
    });
  });

  describe('Audio Slice Integration', () => {
    it('should execute audio slice actions correctly', () => {
      const { setAudioData, togglePlayback, setCurrentTime } = useAppStore.getState();

      setAudioData({
        mp3Url: 'https://example.com/audio.mp3',
        transcript: 'Transcript',
      });
      togglePlayback();
      setCurrentTime(30);

      const state = useAppStore.getState();
      expect(state.mp3Url).toBe('https://example.com/audio.mp3');
      expect(state.transcript).toBe('Transcript');
      expect(state.isPlaying).toBe(true);
      expect(state.currentTime).toBe(30);
    });

    it('should cleanup audio', () => {
      const { setAudioData, togglePlayback, cleanup } = useAppStore.getState();

      setAudioData({ mp3Url: 'test.mp3' });
      togglePlayback();

      cleanup();

      const state = useAppStore.getState();
      expect(state.mp3Url).toBeUndefined();
      expect(state.isPlaying).toBe(false);
    });
  });

  describe('Cross-Slice Operations', () => {
    it('should allow simultaneous operations across all slices', () => {
      const {
        setCurrentDate,
        setPoemData,
        setSearchTerm,
        setSearchResults,
        setAudioData,
        togglePlayback,
      } = useAppStore.getState();

      // Set state in all slices
      setCurrentDate('2024-01-15');
      setPoemData({ poem: ['Test poem'] });
      setSearchTerm('search');
      setSearchResults([{ id: '1', title: 'R', content: 'C', type: 'poem' }]);
      setAudioData({ mp3Url: 'audio.mp3' });
      togglePlayback();

      const state = useAppStore.getState();
      expect(state.currentDate).toBe('2024-01-15');
      expect(state.poem).toEqual(['Test poem']);
      expect(state.searchTerm).toBe('search');
      expect(state.searchResults).toHaveLength(1);
      expect(state.mp3Url).toBe('audio.mp3');
      expect(state.isPlaying).toBe(true);
    });

    it('should maintain independent state between slices', () => {
      const { setCurrentDate, setSearchTerm, setAudioData } = useAppStore.getState();

      // Update content slice
      setCurrentDate('2024-01-15');
      expect(useAppStore.getState().searchTerm).toBe(''); // Search unchanged
      expect(useAppStore.getState().mp3Url).toBeUndefined(); // Audio unchanged

      // Update search slice
      setSearchTerm('test');
      expect(useAppStore.getState().currentDate).toBe('2024-01-15'); // Content unchanged
      expect(useAppStore.getState().mp3Url).toBeUndefined(); // Audio unchanged

      // Update audio slice
      setAudioData({ mp3Url: 'test.mp3' });
      expect(useAppStore.getState().currentDate).toBe('2024-01-15'); // Content unchanged
      expect(useAppStore.getState().searchTerm).toBe('test'); // Search unchanged
    });

    it('should allow resetting individual slices without affecting others', () => {
      const { setCurrentDate, setSearchTerm, setAudioData, resetContent } = useAppStore.getState();

      // Set all slices
      setCurrentDate('2024-01-15');
      setSearchTerm('test');
      setAudioData({ mp3Url: 'audio.mp3' });

      // Reset only content slice
      resetContent();

      const state = useAppStore.getState();
      expect(state.currentDate).toBeUndefined(); // Content reset
      expect(state.searchTerm).toBe('test'); // Search unchanged
      expect(state.mp3Url).toBe('audio.mp3'); // Audio unchanged
    });
  });

  describe('State Access', () => {
    it('should allow accessing individual properties via getState', () => {
      const state = useAppStore.getState();

      // Initial values
      expect(state.currentDate).toBeUndefined();
      expect(state.searchTerm).toBe('');
      expect(state.mp3Url).toBeUndefined();

      // Update one slice
      state.setCurrentDate('2024-01-15');

      // Verify updated value
      const updatedState = useAppStore.getState();
      expect(updatedState.currentDate).toBe('2024-01-15');
    });

    it('should allow accessing multiple properties at once', () => {
      const state = useAppStore.getState();

      const { currentDate, searchTerm, mp3Url } = state;

      expect(currentDate).toBeUndefined();
      expect(searchTerm).toBe('');
      expect(mp3Url).toBeUndefined();
    });
  });
});
