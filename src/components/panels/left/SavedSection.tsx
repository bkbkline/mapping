'use client';

import { useSavedSearches } from '@/hooks/useSavedSearches';
import { useSearchStore } from '@/store/searchStore';
import { Button } from '@/components/ui/button';
import { Search, Trash2, Clock } from 'lucide-react';

export default function SavedSection() {
  const { savedSearches, loading, deleteSavedSearch } = useSavedSearches();
  const { setQuery, setFilters } = useSearchStore();

  const loadSearch = (search: typeof savedSearches[number]) => {
    if (search.filters) {
      setFilters(search.filters);
      if (search.filters.query) {
        setQuery(search.filters.query);
      }
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white">Saved Searches</h3>

      {loading && <p className="text-xs text-gray-500">Loading...</p>}

      {!loading && savedSearches.length === 0 && (
        <p className="text-xs text-gray-500">No saved searches yet. Use filters and save your search.</p>
      )}

      <div className="space-y-1">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 group"
          >
            <Search className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <button
              onClick={() => loadSearch(search)}
              className="flex-1 text-left min-w-0"
            >
              <p className="text-xs text-white truncate">{search.name}</p>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(search.created_at).toLocaleDateString()}
                {search.result_count != null && ` · ${search.result_count} results`}
              </p>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-500 opacity-0 group-hover:opacity-100"
              onClick={() => deleteSavedSearch.mutate(search.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
