import { StateCreator } from 'zustand';
import { AppStore, AuthorSlice } from '../types';

export const createAuthorSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never]],
  [],
  AuthorSlice
> = set => ({
  isAuthorPageOpen: false,
  authorDates: [],
  selectedAuthor: null,
  setAuthorPageOpen: (isOpen: boolean) => set({ isAuthorPageOpen: isOpen }),
  setAuthorDates: (dates: string[]) => set({ authorDates: dates }),
  setSelectedAuthor: (author: string) => set({ selectedAuthor: author }),
});
