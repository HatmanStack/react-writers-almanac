import { describe, it, expect, beforeEach } from 'vitest';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createSearchSlice } from './searchSlice';
import type { SearchSlice, SearchResult } from '../types';

describe('SearchSlice', () => {
  let useTestStore: UseBoundStore<StoreApi<SearchSlice>>;

  beforeEach(() => {
    // Create a fresh store for each test
    useTestStore = create<SearchSlice>()((...args) => createSearchSlice(...args));
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = useTestStore.getState();

      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.isSearching).toBe(false);
    });
  });

  describe('setSearchTerm Action', () => {
    it('should set search term to a non-empty string', () => {
      const { setSearchTerm } = useTestStore.getState();

      setSearchTerm('test query');

      const state = useTestStore.getState();
      expect(state.searchTerm).toBe('test query');
    });

    it('should set search term to empty string', () => {
      const { setSearchTerm } = useTestStore.getState();

      // First set a value
      setSearchTerm('test');
      expect(useTestStore.getState().searchTerm).toBe('test');

      // Then clear it
      setSearchTerm('');
      expect(useTestStore.getState().searchTerm).toBe('');
    });

    it('should update search term multiple times', () => {
      const { setSearchTerm } = useTestStore.getState();

      setSearchTerm('first');
      expect(useTestStore.getState().searchTerm).toBe('first');

      setSearchTerm('second');
      expect(useTestStore.getState().searchTerm).toBe('second');

      setSearchTerm('third');
      expect(useTestStore.getState().searchTerm).toBe('third');
    });

    it('should handle special characters in search term', () => {
      const { setSearchTerm } = useTestStore.getState();

      const specialTerm = 'test & <special> "chars"';
      setSearchTerm(specialTerm);

      expect(useTestStore.getState().searchTerm).toBe(specialTerm);
    });
  });

  describe('setSearchResults Action', () => {
    it('should set search results with valid data', () => {
      const { setSearchResults } = useTestStore.getState();

      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Poem Title',
          content: 'Poem content here',
          date: '2024-01-15',
          type: 'poem',
        },
        {
          id: '2',
          title: 'Author Name',
          content: 'Author bio',
          type: 'author',
        },
      ];

      setSearchResults(mockResults);

      const state = useTestStore.getState();
      expect(state.searchResults).toEqual(mockResults);
      expect(state.searchResults).toHaveLength(2);
    });

    it('should set search results to empty array', () => {
      const { setSearchResults } = useTestStore.getState();

      // First set some results
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: 'Test',
          content: 'Content',
          type: 'poem',
        },
      ];
      setSearchResults(mockResults);
      expect(useTestStore.getState().searchResults).toHaveLength(1);

      // Then clear them
      setSearchResults([]);
      expect(useTestStore.getState().searchResults).toEqual([]);
    });

    it('should replace existing search results', () => {
      const { setSearchResults } = useTestStore.getState();

      const firstResults: SearchResult[] = [
        {
          id: '1',
          title: 'First',
          content: 'Content',
          type: 'poem',
        },
      ];

      const secondResults: SearchResult[] = [
        {
          id: '2',
          title: 'Second',
          content: 'Content',
          type: 'author',
        },
        {
          id: '3',
          title: 'Third',
          content: 'Content',
          type: 'poem',
        },
      ];

      setSearchResults(firstResults);
      expect(useTestStore.getState().searchResults).toHaveLength(1);

      setSearchResults(secondResults);
      const state = useTestStore.getState();
      expect(state.searchResults).toHaveLength(2);
      expect(state.searchResults[0].id).toBe('2');
    });

    it('should handle results without optional date field', () => {
      const { setSearchResults } = useTestStore.getState();

      const results: SearchResult[] = [
        {
          id: '1',
          title: 'Test',
          content: 'Content',
          type: 'author',
          // No date field
        },
      ];

      setSearchResults(results);

      const state = useTestStore.getState();
      expect(state.searchResults[0].date).toBeUndefined();
    });
  });

  describe('clearSearch Action', () => {
    it('should clear search term and results', () => {
      const { setSearchTerm, setSearchResults, clearSearch } = useTestStore.getState();

      // Set some search data
      setSearchTerm('test query');
      setSearchResults([
        {
          id: '1',
          title: 'Result',
          content: 'Content',
          type: 'poem',
        },
      ]);

      // Verify data is set
      let state = useTestStore.getState();
      expect(state.searchTerm).toBe('test query');
      expect(state.searchResults).toHaveLength(1);

      // Clear search
      clearSearch();

      // Verify everything is cleared
      state = useTestStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.isSearching).toBe(false);
    });

    it('should be safe to call when search is already empty', () => {
      const { clearSearch } = useTestStore.getState();

      // Clear when already empty
      clearSearch();

      const state = useTestStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
      expect(state.isSearching).toBe(false);
    });

    it('should clear search multiple times', () => {
      const { setSearchTerm, clearSearch } = useTestStore.getState();

      setSearchTerm('test');
      clearSearch();
      expect(useTestStore.getState().searchTerm).toBe('');

      setSearchTerm('test2');
      clearSearch();
      expect(useTestStore.getState().searchTerm).toBe('');

      setSearchTerm('test3');
      clearSearch();
      expect(useTestStore.getState().searchTerm).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete search workflow', () => {
      const { setSearchTerm, setSearchResults, clearSearch } = useTestStore.getState();

      // Step 1: Set search term
      setSearchTerm('poetry');
      expect(useTestStore.getState().searchTerm).toBe('poetry');

      // Step 2: Set search results
      const results: SearchResult[] = [
        {
          id: '1',
          title: 'Poem 1',
          content: 'Content',
          type: 'poem',
        },
        {
          id: '2',
          title: 'Poem 2',
          content: 'Content',
          type: 'poem',
        },
      ];
      setSearchResults(results);
      expect(useTestStore.getState().searchResults).toHaveLength(2);

      // Step 3: Update search term (new search)
      setSearchTerm('author');
      expect(useTestStore.getState().searchTerm).toBe('author');

      // Step 4: Update results
      const newResults: SearchResult[] = [
        {
          id: '3',
          title: 'Author',
          content: 'Bio',
          type: 'author',
        },
      ];
      setSearchResults(newResults);
      expect(useTestStore.getState().searchResults).toHaveLength(1);

      // Step 5: Clear everything
      clearSearch();
      const state = useTestStore.getState();
      expect(state.searchTerm).toBe('');
      expect(state.searchResults).toEqual([]);
    });

    it('should maintain action references after state updates', () => {
      const { setSearchTerm, setSearchResults } = useTestStore.getState();

      // Use first reference
      setSearchTerm('test');
      setSearchResults([{ id: '1', title: 'T', content: 'C', type: 'poem' }]);

      // Get actions again
      const { setSearchTerm: setSearchTerm2, setSearchResults: setSearchResults2 } =
        useTestStore.getState();

      // Actions should still work
      setSearchTerm2('updated');
      setSearchResults2([
        { id: '2', title: 'U', content: 'C', type: 'poem' },
        { id: '3', title: 'U2', content: 'C', type: 'author' },
      ]);

      const state = useTestStore.getState();
      expect(state.searchTerm).toBe('updated');
      expect(state.searchResults).toHaveLength(2);
    });
  });
});
