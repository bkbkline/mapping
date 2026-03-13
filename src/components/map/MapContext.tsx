'use client';

import { createContext, useContext } from 'react';
import type mapboxgl from 'mapbox-gl';

const MapContext = createContext<mapboxgl.Map | null>(null);

export function MapProvider({
  map,
  children,
}: {
  map: mapboxgl.Map | null;
  children: React.ReactNode;
}) {
  return <MapContext.Provider value={map}>{children}</MapContext.Provider>;
}

export function useMap(): mapboxgl.Map | null {
  return useContext(MapContext);
}

export default MapContext;
