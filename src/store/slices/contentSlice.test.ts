import { describe, it, expect, beforeEach } from 'vitest';
import { create, type StoreApi, type UseBoundStore, type StateCreator } from 'zustand';
import { createContentSlice } from './contentSlice';
import type { ContentSlice } from '../types';

describe('ContentSlice', () => {
  let useTestStore: UseBoundStore<StoreApi<ContentSlice>>;

  beforeEach(() => {
    // Create a fresh store for each test
    // Note: We test the slice in isolation
    // Cast to StateCreator for isolated testing (slices normally access AppStore but we test in isolation)
    const sliceCreator: StateCreator<ContentSlice> =
      createContentSlice as unknown as StateCreator<ContentSlice>;
    useTestStore = create(sliceCreator);
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = useTestStore.getState();

      expect(state.currentDate).toBeUndefined();
      expect(state.poem).toBeUndefined();
      expect(state.poemTitle).toBeUndefined();
      expect(state.author).toBeUndefined();
      expect(state.note).toBeUndefined();
      expect(state.isShowingContentByDate).toBe(true);
    });
  });

  describe('setCurrentDate Action', () => {
    it('should set current date to a string value', () => {
      const { setCurrentDate } = useTestStore.getState();

      setCurrentDate('2024-01-15');

      const state = useTestStore.getState();
      expect(state.currentDate).toBe('2024-01-15');
    });

    it('should allow setting current date to undefined', () => {
      const { setCurrentDate } = useTestStore.getState();

      // First set a value
      setCurrentDate('2024-01-15');
      expect(useTestStore.getState().currentDate).toBe('2024-01-15');

      // Then clear it
      setCurrentDate(undefined);
      expect(useTestStore.getState().currentDate).toBeUndefined();
    });
  });

  describe('setPoemData Action', () => {
    it('should set poem data with all fields', () => {
      const { setPoemData } = useTestStore.getState();

      setPoemData({
        poem: ['Line 1', 'Line 2', 'Line 3'],
        poemTitle: ['Test Poem Title'],
        note: ['Author bio and notes'],
      });

      const state = useTestStore.getState();
      expect(state.poem).toEqual(['Line 1', 'Line 2', 'Line 3']);
      expect(state.poemTitle).toEqual(['Test Poem Title']);
      expect(state.note).toEqual(['Author bio and notes']);
    });

    it('should set poem data with partial fields', () => {
      const { setPoemData } = useTestStore.getState();

      setPoemData({
        poem: ['Line 1', 'Line 2'],
      });

      const state = useTestStore.getState();
      expect(state.poem).toEqual(['Line 1', 'Line 2']);
      expect(state.poemTitle).toBeUndefined();
      expect(state.note).toBeUndefined();
    });

    it('should update existing poem data', () => {
      const { setPoemData } = useTestStore.getState();

      // Set initial data
      setPoemData({
        poem: ['Old line'],
        poemTitle: ['Old Title'],
      });

      // Update with new data
      setPoemData({
        poem: ['New line 1', 'New line 2'],
        poemTitle: ['New Title'],
        note: ['New note'],
      });

      const state = useTestStore.getState();
      expect(state.poem).toEqual(['New line 1', 'New line 2']);
      expect(state.poemTitle).toEqual(['New Title']);
      expect(state.note).toEqual(['New note']);
    });

    it('should handle empty object', () => {
      const { setPoemData } = useTestStore.getState();

      // Set initial data
      setPoemData({
        poem: ['Test'],
      });

      // Update with empty object (should not crash)
      setPoemData({});

      // Initial data should remain
      const state = useTestStore.getState();
      expect(state.poem).toEqual(['Test']);
    });
  });

  describe('setAuthorData Action', () => {
    it('should set author data', () => {
      const { setAuthorData } = useTestStore.getState();

      setAuthorData({
        author: ['Author Name', 'Author Bio'],
      });

      const state = useTestStore.getState();
      expect(state.author).toEqual(['Author Name', 'Author Bio']);
    });

    it('should update existing author data', () => {
      const { setAuthorData } = useTestStore.getState();

      // Set initial author
      setAuthorData({
        author: ['Old Author'],
      });

      // Update author
      setAuthorData({
        author: ['New Author', 'New Bio'],
      });

      const state = useTestStore.getState();
      expect(state.author).toEqual(['New Author', 'New Bio']);
    });

    it('should handle empty object', () => {
      const { setAuthorData } = useTestStore.getState();

      // Set initial data
      setAuthorData({
        author: ['Test Author'],
      });

      // Update with empty object
      setAuthorData({});

      // Data should remain
      const state = useTestStore.getState();
      expect(state.author).toEqual(['Test Author']);
    });
  });

  describe('toggleViewMode Action', () => {
    it('should toggle from true to false', () => {
      const { toggleViewMode } = useTestStore.getState();

      // Initial state should be true
      expect(useTestStore.getState().isShowingContentByDate).toBe(true);

      toggleViewMode();

      expect(useTestStore.getState().isShowingContentByDate).toBe(false);
    });

    it('should toggle from false to true', () => {
      const { toggleViewMode } = useTestStore.getState();

      // Toggle to false
      toggleViewMode();
      expect(useTestStore.getState().isShowingContentByDate).toBe(false);

      // Toggle back to true
      toggleViewMode();
      expect(useTestStore.getState().isShowingContentByDate).toBe(true);
    });

    it('should toggle multiple times', () => {
      const { toggleViewMode } = useTestStore.getState();

      toggleViewMode(); // true -> false
      toggleViewMode(); // false -> true
      toggleViewMode(); // true -> false
      toggleViewMode(); // false -> true

      expect(useTestStore.getState().isShowingContentByDate).toBe(true);
    });
  });

  describe('resetContent Action', () => {
    it('should reset all content fields to initial state', () => {
      const { setPoemData, setAuthorData, setCurrentDate, resetContent } = useTestStore.getState();

      // Set some data
      setCurrentDate('2024-01-15');
      setPoemData({
        poem: ['Line 1'],
        poemTitle: ['Title'],
        note: ['Note'],
      });
      setAuthorData({
        author: ['Author'],
      });

      // Verify data is set
      let state = useTestStore.getState();
      expect(state.currentDate).toBe('2024-01-15');
      expect(state.poem).toEqual(['Line 1']);
      expect(state.author).toEqual(['Author']);

      // Reset
      resetContent();

      // Verify all content is cleared
      state = useTestStore.getState();
      expect(state.currentDate).toBeUndefined();
      expect(state.poem).toBeUndefined();
      expect(state.poemTitle).toBeUndefined();
      expect(state.author).toBeUndefined();
      expect(state.note).toBeUndefined();
      expect(state.isShowingContentByDate).toBe(true);
    });

    it('should reset to initial state when called multiple times', () => {
      const { resetContent } = useTestStore.getState();

      resetContent();
      resetContent();
      resetContent();

      const state = useTestStore.getState();
      expect(state.currentDate).toBeUndefined();
      expect(state.isShowingContentByDate).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex workflow: set data, toggle view, reset', () => {
      const { setCurrentDate, setPoemData, setAuthorData, toggleViewMode, resetContent } =
        useTestStore.getState();

      // Step 1: Set all data
      setCurrentDate('2024-01-15');
      setPoemData({
        poem: ['Line 1', 'Line 2'],
        poemTitle: ['My Poem'],
        note: ['Note text'],
      });
      setAuthorData({
        author: ['John Doe'],
      });

      // Verify data is set
      let state = useTestStore.getState();
      expect(state.currentDate).toBe('2024-01-15');
      expect(state.poem).toHaveLength(2);
      expect(state.isShowingContentByDate).toBe(true);

      // Step 2: Toggle view mode
      toggleViewMode();
      state = useTestStore.getState();
      expect(state.isShowingContentByDate).toBe(false);

      // Step 3: Update some data
      setPoemData({
        poem: ['Updated line'],
      });
      state = useTestStore.getState();
      expect(state.poem).toEqual(['Updated line']);

      // Step 4: Reset everything
      resetContent();
      state = useTestStore.getState();
      expect(state.currentDate).toBeUndefined();
      expect(state.poem).toBeUndefined();
      expect(state.author).toBeUndefined();
      expect(state.isShowingContentByDate).toBe(true);
    });

    it('should maintain action references after state updates', () => {
      const { setCurrentDate, setPoemData } = useTestStore.getState();

      // Set some data using first reference
      setCurrentDate('2024-01-15');
      setPoemData({ poem: ['Initial'] });

      // Get actions again
      const { setCurrentDate: setCurrentDate2, setPoemData: setPoemData2 } =
        useTestStore.getState();

      // Actions should still work
      setCurrentDate2('2024-02-20');
      setPoemData2({ poem: ['Test'] });

      const state = useTestStore.getState();
      expect(state.currentDate).toBe('2024-02-20');
      expect(state.poem).toEqual(['Test']);
    });
  });
});
