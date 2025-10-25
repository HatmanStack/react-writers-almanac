import type { SearchSlice, SliceCreator } from '../types';

/**
 * Search Slice - Manages search term, results, and search state
 *
 * This slice handles all search-related state including:
 * - Current search term
 * - Search results array
 * - Search loading state
 */
export const createSearchSlice: SliceCreator<SearchSlice> = set => ({
  // ============================================================================
  // State
  // ============================================================================
  searchTerm: '',
  searchResults: [],
  isSearching: false,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set the current search term
   */
  setSearchTerm: term => {
    set({ searchTerm: term, isSearching: !!term });
  },

  /**
   * Set search results
   * Replaces existing results completely
   */
  setSearchResults: results => {
    set({ searchResults: results, isSearching: false });
  },

  /**
   * Clear search term, results, and reset searching state
   */
  clearSearch: () => {
    set({
      searchTerm: '',
      searchResults: [],
      isSearching: false,
    });
  },
});
