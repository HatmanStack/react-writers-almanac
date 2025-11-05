/**
 * Store Type Definitions for Zustand State Management
 *
 * Defines TypeScript interfaces for all store slices and the combined AppStore.
 */

// ============================================================================
// Content Slice Types
// ============================================================================

/**
 * ContentSlice manages poem, author, date, and notes state.
 */
export interface ContentSlice {
  // State
  currentDate: string | undefined;
  poem: string | string[] | undefined;
  poemTitle: string | string[] | undefined;
  author: string | string[] | undefined;
  note: string | string[] | undefined;
  isShowingContentByDate: boolean;

  // Actions
  setCurrentDate: (date: string | undefined) => void;
  setPoemData: (data: {
    poem?: string | string[];
    poemTitle?: string | string[];
    note?: string | string[];
  }) => void;
  setAuthorData: (data: { author?: string | string[] }) => void;
  toggleViewMode: () => void;
  resetContent: () => void;
}

// ============================================================================
// Search Slice Types
// ============================================================================

/**
 * SearchResult represents a single search result item.
 */
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  date?: string;
  type: 'poem' | 'author';
}

/**
 * SearchSlice manages search term, results, and search state.
 */
export interface SearchSlice {
  // State
  searchTerm: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  // Actions
  setSearchTerm: (term: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  clearSearch: () => void;
}

// ============================================================================
// Audio Slice Types
// ============================================================================

/**
 * AudioSlice manages audio player state including MP3, transcript, and playback.
 */
export interface AudioSlice {
  // State
  mp3Url: string | undefined;
  transcript: string | undefined;
  isPlaying: boolean;
  currentTime: number;

  // Actions
  setAudioData: (data: { mp3Url?: string; transcript?: string }) => void;
  togglePlayback: () => void;
  setCurrentTime: (time: number) => void;
  cleanup: () => void; // For revoking blob URLs
}

// ============================================================================
// Combined App Store Type
// ============================================================================

/**
 * AppStore combines all slices into a single unified store type.
 */
// ============================================================================
// Poem Slice Types
// ============================================================================

/**
 * PoemSlice manages the state for the poem modal.
 */
export interface PoemSlice {
  // State
  isPoemModalOpen: boolean;
  poemDates: string[];
  selectedPoem: string | null;

  // Actions
  setPoemModalOpen: (isOpen: boolean) => void;
  setPoemDates: (dates: string[]) => void;
  setSelectedPoem: (poem: string | null) => void;
}

// ============================================================================
// Author Slice Types
// ============================================================================

/**
 * AuthorSlice manages the state for the author page.
 */
export interface AuthorSlice {
  // State
  isAuthorPageOpen: boolean;
  authorDates: string[];
  selectedAuthor: string | null;

  // Actions
  setAuthorPageOpen: (isOpen: boolean) => void;
  setAuthorDates: (dates: string[]) => void;
  setSelectedAuthor: (author: string | null) => void;
}
export type AppStore = ContentSlice & SearchSlice & AudioSlice & PoemSlice & AuthorSlice;

// ============================================================================
// Helper Types
// ============================================================================

/**
 * StateCreator type for slice pattern.
 * Used when creating individual slices that will be combined.
 */
export type SliceCreator<T> = (
  set: (partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void,
  get: () => AppStore
) => T;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes a value to an array
 * Handles both string and array inputs from API responses
 */
export function toArray<T>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}
