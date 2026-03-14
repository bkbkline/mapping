'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchStore } from '@/store/searchStore';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { Search, MapPin, X } from 'lucide-react';
import type { Parcel } from '@/types';

export default function SearchSection() {
  const { query, setQuery, searchResults, loading, totalCount } = useSearchStore();
  const { setViewport, selectFeature } = useMapStore();
  const { openRightPanel } = useUIStore();
  const [geocoderQuery, setGeocoderQuery] = useState('');

  const handleParcelClick = (parcel: Parcel) => {
    if (parcel.geometry) {
      const coords = parcel.geometry.coordinates[0]?.[0]?.[0];
      if (coords) {
        setViewport({ center: [coords[0], coords[1]], zoom: 16 });
      }
    }
    selectFeature(parcel.id, 'parcel');
    openRightPanel('parcel');
  };

  return (
    <div className="space-y-3">
      {/* Address / Place Geocoder */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Go to Address</label>
        <div className="relative">
          <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <Input
            value={geocoderQuery}
            onChange={(e) => setGeocoderQuery(e.target.value)}
            placeholder="Search address or place..."
            className="pl-8 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Parcel Search */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">Search Parcels</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="APN, address, or owner..."
            className="pl-8 h-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-gray-500"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7 text-gray-400"
              onClick={() => setQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <p className="text-xs text-gray-500">Searching...</p>}

      {!loading && query && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{totalCount} results</p>
          {searchResults.map((parcel) => (
            <button
              key={parcel.id}
              onClick={() => handleParcelClick(parcel)}
              className="w-full text-left p-2 rounded-md hover:bg-white/5 transition-colors"
            >
              <p className="text-sm text-white truncate">
                {parcel.situs_address || parcel.apn || 'Unknown'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {[parcel.acreage && `${parcel.acreage} ac`, parcel.zoning, parcel.county]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
