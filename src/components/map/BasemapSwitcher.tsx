'use client';

import { useMapStore } from '@/store/mapStore';
import { useMapInstance } from './MapInstanceContext';
import type { BasemapStyle } from '@/types';

const basemaps: { id: BasemapStyle; label: string }[] = [
  { id: 'satellite-streets-v12', label: 'Satellite' },
  { id: 'streets-v12', label: 'Streets' },
  { id: 'light-v11', label: 'Light' },
  { id: 'dark-v11', label: 'Dark' },
  { id: 'outdoors-v12', label: 'Outdoors' },
];

export default function BasemapSwitcher({ onClose }: { onClose: () => void }) {
  const { basemap, setBasemap } = useMapStore();
  const { map } = useMapInstance();

  const handleSelect = (style: BasemapStyle) => {
    setBasemap(style);
    if (map) {
      map.setStyle(`mapbox://styles/mapbox/${style}`);
    }
    onClose();
  };

  return (
    <div className="bg-[#1A1F36] border border-white/10 rounded-lg shadow-xl p-2 w-40">
      <p className="text-xs text-gray-400 px-2 py-1 font-medium">Basemap</p>
      {basemaps.map((b) => (
        <button
          key={b.id}
          onClick={() => handleSelect(b.id)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
            basemap === b.id
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
