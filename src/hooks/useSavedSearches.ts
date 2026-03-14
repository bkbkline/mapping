'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useSearchStore } from '@/store/searchStore';
import type { SavedSearch, SearchFilters } from '@/types';

export function useSavedSearches() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { setSavedSearches } = useSearchStore();

  const query = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSavedSearches(data || []);
      return data as SavedSearch[];
    },
  });

  const createSavedSearch = useMutation({
    mutationFn: async ({ name, filters, viewport }: { name: string; filters: SearchFilters; viewport?: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({ name, filters, viewport })
        .select()
        .single();
      if (error) throw error;
      return data as SavedSearch;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  const deleteSavedSearch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_searches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-searches'] }),
  });

  return {
    savedSearches: query.data || [],
    loading: query.isLoading,
    createSavedSearch,
    deleteSavedSearch,
  };
}
