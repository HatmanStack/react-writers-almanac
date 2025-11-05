import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createContentSlice } from './slices/contentSlice';
import { createSearchSlice } from './slices/searchSlice';
import { createAudioSlice } from './slices/audioSlice';
import { createPoemSlice } from './slices/poemSlice';
import { createAuthorSlice } from './slices/authorSlice';
import type { AppStore } from './types';

/**
 * Main Application Store
 *
 * Combines all slices (Content, Search, Audio) into a single unified store.
 * Configured with Redux DevTools for development debugging.
 *
 * Usage:
 * ```tsx
 * import { useAppStore } from './store/useAppStore';
 *
 * function MyComponent() {
 *   const currentDate = useAppStore(state => state.currentDate);
 *   const setCurrentDate = useAppStore(state => state.setCurrentDate);
 *
 *   return <div>{currentDate}</div>;
 * }
 * ```
 */
export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...createContentSlice(set, get),
      ...createSearchSlice(set, get),
      ...createAudioSlice(set, get),
      ...createPoemSlice(set, get),
      ...createAuthorSlice(set, get),
    }),
    {
      name: 'WritersAlmanacStore',
      enabled: import.meta.env.DEV, // Only enable in development
    }
  )
);

// Export for direct access (primarily for testing)
export type { AppStore } from './types';
