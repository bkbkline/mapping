'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { MapProvider } from './MapContext';
import MapControls from './MapControls';
import MapHeader from './MapHeader';
import MapSearchBar from './MapSearchBar';
import BasemapSwitcher from './BasemapSwitcher';
import type { MapRecord } from '@/types';

// Lazy-loaded panels -- rendered only when toggled open
import dynamic from 'next/dynamic';
const DrawToolbar = dynamic(() => import('@/components/map/DrawToolbar'), {
  ssr: false,
  loading: () => null,
});
const LayerPanel = dynamic(() => import('@/components/map/LayerPanel'), {
  ssr: false,
  loading: () => null,
});
const FeatureInspector = dynamic(
  () => import('@/components/map/FeatureInspector'),
  { ssr: false, loading: () => null },
);

interface MapWorkspaceProps {
  mapId: string;
}

export default function MapWorkspace({ mapId }: MapWorkspaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const {
    setActiveMapId,
    setMapLoaded,
    setViewport,
    setBasemap,
    setActiveTool,
  } = useMapStore();

  const { sidebarOpen, layerPanelOpen, inspectorOpen } = useUIStore();

  // ----------------------------------------------------------------
  // Load map record from Supabase & initialise Mapbox
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let cancelled = false;

    async function init() {
      // Fetch persisted map settings
      const { data: mapRecord } = await supabase
        .from('maps')
        .select('*')
        .eq('id', mapId)
        .single<MapRecord>();

      if (cancelled) return;

      const center: [number, number] = mapRecord
        ? [mapRecord.center_lng, mapRecord.center_lat]
        : [-98.5, 39.8];
      const zoom = mapRecord?.zoom ?? 4;
      const style = mapRecord?.basemap ?? 'satellite-streets-v12';

      mapboxgl.accessToken = env.MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: `mapbox://styles/mapbox/${style}`,
        center,
        zoom,
        bearing: 0,
        pitch: 0,
        attributionControl: false,
        preserveDrawingBuffer: true, // needed for export/screenshot
      });

      // Add compact attribution
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

      // Scale bar
      map.addControl(
        new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }),
        'bottom-left',
      );

      map.on('load', () => {
        if (cancelled) return;
        setActiveMapId(mapId);
        setMapLoaded(true);
        setBasemap(style);
        setViewport({ center, zoom, bearing: 0, pitch: 0 });
      });

      // Sync viewport to store on move
      map.on('moveend', () => {
        const c = map.getCenter();
        setViewport({
          center: [c.lng, c.lat],
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch(),
        });
      });

      mapRef.current = map;
      setMapInstance(map);
    }

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInstance(null);
        setMapLoaded(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // ----------------------------------------------------------------
  // ResizeObserver -- handle sidebar / panel toggles
  // ----------------------------------------------------------------
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || !mapRef.current) return;

    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapInstance, sidebarOpen, layerPanelOpen, inspectorOpen]);

  // ----------------------------------------------------------------
  // Auto-save viewport every 30 seconds (debounced)
  // ----------------------------------------------------------------
  const saveViewport = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    await supabase
      .from('maps')
      .update({
        center_lng: c.lng,
        center_lat: c.lat,
        zoom: map.getZoom(),
      })
      .eq('id', mapId);
  }, [mapId, supabase]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(saveViewport, 30_000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [saveViewport]);

  // ----------------------------------------------------------------
  // Keyboard shortcuts
  // ----------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input / textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key.toUpperCase()) {
        case 'V':
          setActiveTool('pan');
          break;
        case 'P':
          setActiveTool('polygon');
          break;
        case 'R':
          setActiveTool('rectangle');
          break;
        case 'C':
          setActiveTool('circle');
          break;
        case 'L':
          setActiveTool('line');
          break;
        case 'M':
          setActiveTool('point');
          break;
        case 'D':
          setActiveTool('measure_distance');
          break;
        case 'A':
          setActiveTool('measure_area');
          break;
        case 'ESCAPE':
          setActiveTool('pan');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <MapProvider map={mapInstance}>
      <div className="relative flex h-full w-full flex-col bg-[#0A0E1A]">
        {/* Top header bar */}
        <MapHeader mapId={mapId} />

        {/* Map + overlays */}
        <div className="relative flex-1 overflow-hidden">
          {/* Mapbox container */}
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* Search bar - top center */}
          <div className="absolute left-1/2 top-3 z-10 w-full max-w-md -translate-x-1/2 px-4">
            <MapSearchBar />
          </div>

          {/* Map controls - top right */}
          <MapControls />

          {/* Draw toolbar - left side */}
          <DrawToolbar />

          {/* Layer panel - right side */}
          {layerPanelOpen && <LayerPanel />}

          {/* Feature inspector - right side below layer panel */}
          {inspectorOpen && <FeatureInspector />}

          {/* Basemap switcher - bottom right */}
          <BasemapSwitcher />
        </div>
      </div>
    </MapProvider>
  );
}
