'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchStore } from '@/store/searchStore';
import type { Parcel, SearchFilters } from '@/types';

export function useSearch() {
  const supabase = createClient();
  const { query, filters, setSearchResults, setLoading, setTotalCount } = useSearchStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const executeSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      let q = supabase.from('parcels').select('*', { count: 'exact' });

      if (searchQuery) {
        q = q.or(`apn.ilike.%${searchQuery}%,situs_address.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`);
      }
      if (searchFilters.minAcreage != null) {
        q = q.gte('acreage', searchFilters.minAcreage);
      }
      if (searchFilters.maxAcreage != null) {
        q = q.lte('acreage', searchFilters.maxAcreage);
      }
      if (searchFilters.zoning?.length) {
        q = q.in('zoning', searchFilters.zoning);
      }
      if (searchFilters.minValue != null) {
        q = q.gte('assessed_value', searchFilters.minValue);
      }
      if (searchFilters.maxValue != null) {
        q = q.lte('assessed_value', searchFilters.maxValue);
      }
      if (searchFilters.owner) {
        q = q.ilike('owner_name', `%${searchFilters.owner}%`);
      }
      if (searchFilters.county) {
        q = q.eq('county', searchFilters.county);
      }
      if (searchFilters.state) {
        q = q.eq('state_abbr', searchFilters.state);
      }

      q = q.order('updated_at', { ascending: false }).limit(100);

      const { data, count, error } = await q;
      if (error) throw error;

      setSearchResults((data as Parcel[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, setSearchResults, setLoading, setTotalCount]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query || Object.keys(filters).length > 0) {
        executeSearch(query, filters);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, executeSearch]);

  return { executeSearch };
}
