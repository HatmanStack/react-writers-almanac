import type { ContentSlice, SliceCreator } from '../types';
import { presentDate } from '../../utils/dateMapping';

/**
 * Normalize a value to an array.
 * Ensures state always contains arrays, never raw strings.
 */
function normalizeToArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

/**
 * Content Slice - Manages poem, author, date, and notes state
 *
 * This slice handles all content-related state including:
 * - Current date being displayed
 * - Poem text, title, and notes
 * - Author information
 * - View mode toggle (by date vs by search)
 *
 * All array fields are normalized at the setter boundary.
 * State always contains string[] (never raw strings).
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
  activeDate: presentDate(),

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
   * Record the broadcast the reader is viewing, in YYYYMMDD format.
   * Survives navigation to author and poem-title pages.
   */
  setActiveDate: date => {
    set({ activeDate: date });
  },

  /**
   * Set poem data (title, content, notes)
   * Accepts partial updates - only provided fields will be updated.
   * Normalizes string inputs to arrays for consistent state shape.
   */
  setPoemData: data => {
    set({
      ...(data.poem !== undefined && { poem: normalizeToArray(data.poem) }),
      ...(data.poemTitle !== undefined && { poemTitle: normalizeToArray(data.poemTitle) }),
      ...(data.note !== undefined && { note: normalizeToArray(data.note) }),
    });
  },

  /**
   * Set author data
   * Accepts partial updates - only provided fields will be updated.
   * Normalizes string inputs to arrays for consistent state shape.
   */
  setAuthorData: data => {
    set({
      ...(data.author !== undefined && { author: normalizeToArray(data.author) }),
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
      activeDate: presentDate(),
    });
  },
});
