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
  poem: string[] | undefined;
  poemTitle: string[] | undefined;
  author: string[] | undefined;
  note: string[] | undefined;
  isShowingContentByDate: boolean;

  // Actions
  setCurrentDate: (date: string | undefined) => void;
  setPoemData: (data: { poem?: string[]; poemTitle?: string[]; note?: string[] }) => void;
  setAuthorData: (data: { author?: string[] }) => void;
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
export type AppStore = ContentSlice & SearchSlice & AudioSlice;

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
