import { create } from 'zustand';
import type { Parcel, SearchFilters, SavedSearch } from '@/types';

interface SearchStore {
  query: string;
  filters: SearchFilters;
  savedSearches: SavedSearch[];
  searchResults: Parcel[];
  loading: boolean;
  totalCount: number;

  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSavedSearches: (searches: SavedSearch[]) => void;
  addSavedSearch: (search: SavedSearch) => void;
  removeSavedSearch: (id: string) => void;
  setSearchResults: (results: Parcel[]) => void;
  setLoading: (loading: boolean) => void;
  setTotalCount: (count: number) => void;
}

const defaultFilters: SearchFilters = {};

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  filters: defaultFilters,
  savedSearches: [],
  searchResults: [],
  loading: false,
  totalCount: 0,

  setQuery: (query) => set({ query }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setSavedSearches: (searches) => set({ savedSearches: searches }),
  addSavedSearch: (search) => set((state) => ({ savedSearches: [...state.savedSearches, search] })),
  removeSavedSearch: (id) => set((state) => ({
    savedSearches: state.savedSearches.filter((s) => s.id !== id),
  })),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ loading }),
  setTotalCount: (count) => set({ totalCount: count }),
}));
