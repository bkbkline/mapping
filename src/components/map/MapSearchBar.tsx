'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Hash, Navigation, Clock, X } from 'lucide-react';
import { useMap } from './MapContext';
import { createClient } from '@/lib/supabase/client';

interface SearchResult {
  id: string;
  category: 'address' | 'parcel' | 'coordinate';
  label: string;
  sublabel?: string;
  center: [number, number];
}

const RECENT_SEARCHES_KEY = 'land-intel-recent-searches';
const MAX_RECENT = 10;

export default function MapSearchBar() {
  const map = useMap();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Detect coordinate patterns
  const parseCoordinates = (input: string): [number, number] | null => {
    // Decimal degrees: 34.0522, -118.2437 or 34.0522 -118.2437
    const ddMatch = input.match(
      /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/,
    );
    if (ddMatch) {
      const lat = parseFloat(ddMatch[1]);
      const lng = parseFloat(ddMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return [lng, lat];
      }
    }

    // DMS: 34°3'8"N 118°14'37"W
    const dmsMatch = input.match(
      /(\d+)[°]\s*(\d+)['\u2019]\s*(\d+\.?\d*)["\u201D]\s*([NSns])\s*(\d+)[°]\s*(\d+)['\u2019]\s*(\d+\.?\d*)["\u201D]\s*([EWew])/,
    );
    if (dmsMatch) {
      let lat =
        parseInt(dmsMatch[1]) +
        parseInt(dmsMatch[2]) / 60 +
        parseFloat(dmsMatch[3]) / 3600;
      let lng =
        parseInt(dmsMatch[5]) +
        parseInt(dmsMatch[6]) / 60 +
        parseFloat(dmsMatch[7]) / 3600;
      if (dmsMatch[4].toUpperCase() === 'S') lat = -lat;
      if (dmsMatch[8].toUpperCase() === 'W') lng = -lng;
      return [lng, lat];
    }

    return null;
  };

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const searchResults: SearchResult[] = [];

      // 1) Check for coordinate pattern
      const coords = parseCoordinates(q.trim());
      if (coords) {
        searchResults.push({
          id: `coord-${coords[0]}-${coords[1]}`,
          category: 'coordinate',
          label: `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`,
          sublabel: 'Coordinate',
          center: coords,
        });
      }

      // 2) Geocode via proxy
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(q)}&limit=5`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data.features) {
            data.features.forEach(
              (f: { id: string; place_name: string; text: string; center: [number, number] }) => {
                searchResults.push({
                  id: `geo-${f.id}`,
                  category: 'address',
                  label: f.text,
                  sublabel: f.place_name,
                  center: f.center,
                });
              },
            );
          }
        }
      } catch {
        // geocode api not available, skip
      }

      // 3) Search parcels via Supabase (fuzzy on APN or address)
      try {
        const { data: parcels } = await supabase
          .from('parcels')
          .select('id, apn, situs_address, geometry')
          .or(`apn.ilike.%${q}%,situs_address.ilike.%${q}%`)
          .limit(5);

        if (parcels) {
          parcels.forEach((p) => {
            // Extract center from geometry if available
            let center: [number, number] = [-98.5, 39.8];
            if (p.geometry?.coordinates) {
              try {
                // MultiPolygon: first coord of first ring of first polygon
                const firstCoord = p.geometry.coordinates[0]?.[0]?.[0];
                if (firstCoord) center = [firstCoord[0], firstCoord[1]];
              } catch {
                // ignore
              }
            }
            searchResults.push({
              id: `parcel-${p.id}`,
              category: 'parcel',
              label: p.apn || 'Unknown APN',
              sublabel: p.situs_address || undefined,
              center,
            });
          });
        }
      } catch {
        // parcels table may not exist yet
      }

      setResults(searchResults);
      setLoading(false);
    },
    [supabase],
  );

  // Debounced search
  const handleInput = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const selectResult = (result: SearchResult) => {
    if (!map) return;

    map.flyTo({
      center: result.center,
      zoom: result.category === 'parcel' ? 17 : 15,
      duration: 1500,
    });

    // Save to recent
    const updated = [
      result,
      ...recentSearches.filter((r) => r.id !== result.id),
    ].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setQuery(result.label);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const categoryIcon = (cat: SearchResult['category']) => {
    switch (cat) {
      case 'address':
        return <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />;
      case 'parcel':
        return <Hash className="h-3.5 w-3.5 text-[#F59E0B]" />;
      case 'coordinate':
        return <Navigation className="h-3.5 w-3.5 text-[#9CA3AF]" />;
    }
  };

  const showDropdown =
    isOpen && (results.length > 0 || (query === '' && recentSearches.length > 0));

  return (
    <div className="relative">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search address, APN, coordinates..."
          className="h-10 w-full rounded-lg bg-[#1F2937]/95 pl-10 pr-9 text-sm text-[#F9FAFB] placeholder-[#9CA3AF] outline-none border border-[#374151] focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/30 backdrop-blur-sm shadow-lg transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#F9FAFB]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#374151] border-t-[#F59E0B]" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1 w-full max-h-80 overflow-y-auto rounded-lg bg-[#1F2937]/95 border border-[#374151] shadow-xl backdrop-blur-sm z-50"
        >
          {/* Search results */}
          {results.length > 0 && (
            <div>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectResult(r)}
                  className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-[#374151]/60 transition-colors"
                >
                  <div className="mt-0.5">{categoryIcon(r.category)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[#F9FAFB]">
                      {r.label}
                    </div>
                    {r.sublabel && (
                      <div className="truncate text-[11px] text-[#9CA3AF]">
                        {r.sublabel}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent searches (shown when query is empty) */}
          {query === '' && recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF]">
                Recent Searches
              </div>
              {recentSearches.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectResult(r)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#374151]/60 transition-colors"
                >
                  <Clock className="h-3.5 w-3.5 text-[#9CA3AF]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[#F9FAFB]">
                      {r.label}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
