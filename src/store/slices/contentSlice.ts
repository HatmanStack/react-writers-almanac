import type { ContentSlice, SliceCreator } from '../types';

/**
 * Content Slice - Manages poem, author, date, and notes state
 *
 * This slice handles all content-related state including:
 * - Current date being displayed
 * - Poem text, title, and notes
 * - Author information
 * - View mode toggle (by date vs by search)
 */
export const createContentSlice: SliceCreator<ContentSlice> = set => ({
  // ============================================================================
  // State
  // ============================================================================
  currentDate: undefined,
  poem: undefined,
  poemTitle: undefined,
  author: undefined,
  note: undefined,
  isShowingContentByDate: true,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Set the current date being displayed
   */
  setCurrentDate: date => {
    set({ currentDate: date });
  },

  /**
   * Set poem data (title, content, notes)
   * Accepts partial updates - only provided fields will be updated
   */
  setPoemData: data => {
    set({
      ...(data.poem !== undefined && { poem: data.poem }),
      ...(data.poemTitle !== undefined && { poemTitle: data.poemTitle }),
      ...(data.note !== undefined && { note: data.note }),
    });
  },

  /**
   * Set author data
   * Accepts partial updates - only provided fields will be updated
   */
  setAuthorData: data => {
    set({
      ...(data.author !== undefined && { author: data.author }),
    });
  },

  /**
   * Toggle between date view and search view
   */
  toggleViewMode: () => {
    set(state => ({
      isShowingContentByDate: !state.isShowingContentByDate,
    }));
  },

  /**
   * Set the view mode to a specific value
   */
  setViewMode: (isShowingByDate: boolean) => {
    set({ isShowingContentByDate: isShowingByDate });
  },

  /**
   * Reset all content to initial state
   */
  resetContent: () => {
    set({
      currentDate: undefined,
      poem: undefined,
      poemTitle: undefined,
      author: undefined,
      note: undefined,
      isShowingContentByDate: true,
    });
  },
});
