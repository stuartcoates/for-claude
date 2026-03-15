import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState, SortField, Category, Disposition, PreciousnessLevel } from '../types';

interface AppStore {
  activeRoom: string | null;
  filters: FilterState;
  sortField: SortField;
  sortDirection: 'asc' | 'desc';
  darkMode: boolean;
  setActiveRoom: (room: string | null) => void;
  setFilterRoom: (room: string | null) => void;
  setFilterCategory: (category: Category | null) => void;
  setFilterDisposition: (disposition: Disposition | null) => void;
  setFilterPreciousness: (preciousness: PreciousnessLevel | null) => void;
  clearFilters: () => void;
  setSort: (field: SortField, direction: 'asc' | 'desc') => void;
  toggleDarkMode: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  room: null,
  category: null,
  disposition: null,
  preciousness: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeRoom: null,
      filters: DEFAULT_FILTERS,
      sortField: 'createdAt',
      sortDirection: 'desc',
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,

      setActiveRoom: (room) => set({ activeRoom: room }),

      setFilterRoom: (room) => set(state => ({ filters: { ...state.filters, room } })),
      setFilterCategory: (category) => set(state => ({ filters: { ...state.filters, category } })),
      setFilterDisposition: (disposition) => set(state => ({ filters: { ...state.filters, disposition } })),
      setFilterPreciousness: (preciousness) => set(state => ({ filters: { ...state.filters, preciousness } })),
      clearFilters: () => set({ filters: DEFAULT_FILTERS }),

      setSort: (sortField, sortDirection) => set({ sortField, sortDirection }),

      toggleDarkMode: () => set(state => {
        const darkMode = !state.darkMode;
        document.documentElement.classList.toggle('dark', darkMode);
        return { darkMode };
      }),
    }),
    {
      name: 'home-audit-app-state',
      partialize: (state) => ({
        activeRoom: state.activeRoom,
        darkMode: state.darkMode,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
    }
  )
);
