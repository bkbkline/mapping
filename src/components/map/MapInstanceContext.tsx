'use client';

import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type mapboxgl from 'mapbox-gl';

interface MapInstanceContextValue {
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map | null) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const MapInstanceContext = createContext<MapInstanceContextValue | null>(null);

export function MapInstanceProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null!);

  return (
    <MapInstanceContext.Provider value={{ map, setMap, containerRef }}>
      {children}
    </MapInstanceContext.Provider>
  );
}

export function useMapInstance() {
  const ctx = useContext(MapInstanceContext);
  if (!ctx) throw new Error('useMapInstance must be used within MapInstanceProvider');
  return ctx;
}
