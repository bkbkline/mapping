'use client';

import { useState, useRef, useEffect } from 'react';
import { Map as MapIcon, X } from 'lucide-react';
import { useMap } from './MapContext';
import { useMapStore } from '@/store/mapStore';
import { createClient } from '@/lib/supabase/client';
import type { BasemapStyle } from '@/types';

const BASEMAPS: { id: BasemapStyle; label: string; color: string }[] = [
  { id: 'satellite-streets-v12', label: 'Satellite', color: '#1a3a2a' },
  { id: 'satellite-v9', label: 'Satellite Pure', color: '#0d2818' },
  { id: 'streets-v12', label: 'Streets', color: '#e8e0d8' },
  { id: 'outdoors-v12', label: 'Outdoors', color: '#d4e4bc' },
  { id: 'dark-v11', label: 'Dark', color: '#1a1a2e' },
  { id: 'light-v11', label: 'Light', color: '#f0ece2' },
];

export default function BasemapSwitcher() {
  const map = useMap();
  const { basemap, setBasemap, activeMapId } = useMapStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectBasemap = async (id: BasemapStyle) => {
    if (!map) return;

    // Capture user-added sources and layers before style change
    const style = map.getStyle();
    const userSources: Record<string, mapboxgl.AnySourceData> = {};
    const userLayers: mapboxgl.AnyLayer[] = [];

    if (style?.sources) {
      Object.entries(style.sources).forEach(([key, src]) => {
        // Skip mapbox internal sources
        if (!key.startsWith('mapbox') && key !== 'composite' && key !== 'mapbox-dem') {
          userSources[key] = src as mapboxgl.AnySourceData;
        }
      });
    }

    if (style?.layers) {
      style.layers.forEach((layer) => {
        if (
          layer.source &&
          typeof layer.source === 'string' &&
          !layer.source.startsWith('mapbox') &&
          layer.source !== 'composite'
        ) {
          userLayers.push(layer as mapboxgl.AnyLayer);
        }
      });
    }

    // Set new style
    map.setStyle(`mapbox://styles/mapbox/${id}`);

    // Re-add user sources + layers after style loads
    map.once('style.load', () => {
      Object.entries(userSources).forEach(([key, src]) => {
        if (!map.getSource(key)) {
          map.addSource(key, src);
        }
      });
      userLayers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer);
        }
      });
    });

    setBasemap(id);
    setOpen(false);

    // Persist to DB
    if (activeMapId) {
      await supabase
        .from('maps')
        .update({ basemap: id })
        .eq('id', activeMapId);
    }
  };

  return (
    <div ref={panelRef} className="absolute bottom-6 right-3 z-10">
      {open ? (
        <div className="w-64 rounded-lg bg-[#1F2937]/95 p-3 shadow-xl backdrop-blur-sm border border-[#374151]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#F9FAFB]">Basemap</span>
            <button
              onClick={() => setOpen(false)}
              className="text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BASEMAPS.map((b) => (
              <button
                key={b.id}
                onClick={() => selectBasemap(b.id)}
                className={`group flex flex-col items-center gap-1 rounded-md p-1.5 transition-colors ${
                  basemap === b.id
                    ? 'ring-2 ring-[#F59E0B] bg-[#374151]/60'
                    : 'hover:bg-[#374151]/40'
                }`}
              >
                {/* Thumbnail placeholder */}
                <div
                  className="h-12 w-full rounded border border-[#374151] transition-transform group-hover:scale-105"
                  style={{ backgroundColor: b.color }}
                />
                <span className="text-[10px] text-[#9CA3AF] group-hover:text-[#F9FAFB]">
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F2937]/90 text-[#F9FAFB] hover:bg-[#374151] transition-colors backdrop-blur-sm border border-[#374151]/50 shadow-lg"
          title="Change basemap"
        >
          <MapIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
