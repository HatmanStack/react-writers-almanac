import { StateCreator } from 'zustand';
import { AppStore, PoemSlice } from '../types';

export const createPoemSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never]],
  [],
  PoemSlice
> = set => ({
  isPoemModalOpen: false,
  poemDates: [],
  selectedPoem: null,
  setPoemModalOpen: (isOpen: boolean) => set({ isPoemModalOpen: isOpen }),
  setPoemDates: (dates: string[]) => set({ poemDates: dates }),
  setSelectedPoem: (poem: string) => set({ selectedPoem: poem }),
});
