'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { useMapStore } from '@/store/mapStore';
import MapSidebar from './MapSidebar';
import MapStatusBar from './MapStatusBar';
import type { MapRecord, GeometryType } from '@/types';

import dynamic from 'next/dynamic';
const DrawToolbar = dynamic(() => import('./DrawToolbar'), { ssr: false, loading: () => null });
const FeatureInspector = dynamic(() => import('./FeatureInspector'), { ssr: false, loading: () => null });
const FeaturePropertiesPanel = dynamic(() => import('./FeaturePropertiesPanel'), { ssr: false, loading: () => null });

export default function MainMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const [coordinates, setCoordinates] = useState({ lng: -98.5, lat: 39.8, zoom: 4 });
  const [activeMapRecord, setActiveMapRecord] = useState<MapRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [terrain3D, setTerrain3D] = useState(false);
  const [drawnGeometry, setDrawnGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [drawnGeometryType, setDrawnGeometryType] = useState<GeometryType | null>(null);
  const supabase = createClient();
  const { setMapLoaded, setViewport, setBasemap, activeTool, setActiveTool, selectFeature } = useMapStore();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5, 39.8],
      zoom: 4,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    // Controls
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }), 'bottom-left');
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    }), 'top-right');

    // Mapbox Draw
    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
    });
    map.addControl(draw as unknown as mapboxgl.IControl);
    drawRef.current = draw;

    map.on('load', () => {
      setMapLoaded(true);
      setBasemap('satellite-streets-v12');

      // Add terrain source for 3D toggle
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    });

    map.on('mousemove', (e) => {
      setCoordinates({
        lng: parseFloat(e.lngLat.lng.toFixed(4)),
        lat: parseFloat(e.lngLat.lat.toFixed(4)),
        zoom: parseFloat(map.getZoom().toFixed(1)),
      });
    });

    map.on('zoom', () => {
      setCoordinates((prev) => ({
        ...prev,
        zoom: parseFloat(map.getZoom().toFixed(1)),
      }));
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setViewport({
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    // Draw events
    map.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const geom = feature.geometry;
        let geomType: GeometryType = 'Point';
        if (geom.type === 'Polygon') geomType = 'Polygon';
        else if (geom.type === 'LineString') geomType = 'LineString';
        setDrawnGeometry(geom);
        setDrawnGeometryType(geomType);
      }
    });

    map.on('draw.selectionchange', (e: { features: GeoJSON.Feature[] }) => {
      if (e.features.length > 0) {
        const fid = e.features[0].id as string;
        selectFeature(fid, 'annotation');
      }
    });

    // Click handler for parcel inspection (only in pan mode)
    map.on('click', async (e) => {
      const currentTool = useMapStore.getState().activeTool;
      if (currentTool !== 'pan') return;

      try {
        const supabaseClient = createClient();
        const point = e.lngLat;
        const { data: nearbyParcels } = await supabaseClient.rpc('find_parcels_at_point', {
          lng: point.lng,
          lat: point.lat,
        });
        if (nearbyParcels && nearbyParcels.length > 0) {
          selectFeature(nearbyParcels[0].id, 'parcel');
        }
      } catch {
        // Parcel click inspection is best-effort
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync draw tool with store activeTool
  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) return;

    const drawModeMap: Record<string, string> = {
      pan: 'simple_select',
      point: 'draw_point',
      line: 'draw_line_string',
      polygon: 'draw_polygon',
      rectangle: 'draw_polygon',
      circle: 'draw_polygon',
    };

    const mode = drawModeMap[activeTool];
    if (mode) {
      try {
        draw.changeMode(mode as string);
      } catch {
        // Mode change can fail if draw isn't ready
      }
    }
  }, [activeTool]);

  // Keyboard shortcut: Escape resets to pan
  // (All other shortcuts are handled by DrawToolbar's built-in keyboard handler)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        setActiveTool('pan');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  // 3D terrain toggle
  const toggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (terrain3D) {
      map.setTerrain(null);
      map.easeTo({ pitch: 0 });
      setTerrain3D(false);
    } else {
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      map.easeTo({ pitch: 60 });
      setTerrain3D(true);
    }
  }, [terrain3D]);

  const flyTo = useCallback((lng: number, lat: number, zoom: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 2000 });
  }, []);

  const setStyle = useCallback((styleId: string) => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(`mapbox://styles/mapbox/${styleId}`);
    setBasemap(styleId);

    // Re-add terrain source after style change
    map.once('style.load', () => {
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      if (terrain3D) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
      }
    });
  }, [setBasemap, terrain3D]);

  const handleSelectMap = useCallback((rec: MapRecord) => {
    setActiveMapRecord(rec);
    flyTo(rec.center_lng, rec.center_lat, rec.zoom);
  }, [flyTo]);

  // Handle overlay toggles from sidebar
  const handleOverlayToggle = useCallback((overlayId: string, enabled: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    if (overlayId === 'contours') {
      if (enabled) {
        if (!map.getSource('contours-source')) {
          map.addSource('contours-source', {
            type: 'vector',
            url: 'mapbox://mapbox.mapbox-terrain-v2',
          });
        }
        if (!map.getLayer('contour-lines')) {
          map.addLayer({
            id: 'contour-lines',
            type: 'line',
            source: 'contours-source',
            'source-layer': 'contour',
            paint: {
              'line-color': '#f0e68c',
              'line-width': ['match', ['get', 'index'], 5, 1.5, 10, 2, 0.8],
              'line-opacity': 0.5,
            },
          });
        }
      } else {
        if (map.getLayer('contour-lines')) map.removeLayer('contour-lines');
      }
    }

    if (overlayId === 'counties') {
      if (enabled) {
        if (!map.getSource('counties-source')) {
          map.addSource('counties-source', {
            type: 'vector',
            url: 'mapbox://mapbox.boundaries-adm2-v4',
          });
        }
        if (!map.getLayer('county-lines')) {
          map.addLayer({
            id: 'county-lines',
            type: 'line',
            source: 'counties-source',
            'source-layer': 'boundaries_admin_2',
            paint: {
              'line-color': '#ff6b6b',
              'line-width': 1.5,
              'line-opacity': 0.6,
              'line-dasharray': [3, 2],
            },
          });
        }
      } else {
        if (map.getLayer('county-lines')) map.removeLayer('county-lines');
      }
    }
  }, []);

  // Handle drawn feature completion (save/discard)
  const handleDrawComplete = useCallback(() => {
    setDrawnGeometry(null);
    setDrawnGeometryType(null);
    setActiveTool('pan');
    const draw = drawRef.current;
    if (draw) {
      draw.deleteAll();
    }
  }, [setActiveTool]);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; text: string; type: string; center?: [number, number] }>>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) { setSearchResults([]); setSearchOpen(false); return; }

    searchTimerRef.current = setTimeout(async () => {
      const results: typeof searchResults = [];
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${env.MAPBOX_TOKEN}&autocomplete=true&limit=3`
        );
        const data = await res.json();
        if (data.features) {
          data.features.forEach((f: { id: string; place_name: string; center: [number, number] }) => {
            results.push({ id: f.id, text: f.place_name, type: 'address', center: f.center });
          });
        }
      } catch { /* ignore */ }

      try {
        const { data: parcels } = await supabase
          .from('parcels')
          .select('id, apn, situs_address, owner_name')
          .or(`apn.ilike.%${query}%,situs_address.ilike.%${query}%,owner_name.ilike.%${query}%`)
          .limit(3);
        if (parcels) {
          parcels.forEach((p: { id: string; apn: string | null; situs_address: string | null; owner_name: string | null }) => {
            results.push({
              id: p.id,
              text: p.situs_address || p.apn || p.owner_name || 'Unknown parcel',
              type: 'parcel',
            });
          });
        }
      } catch { /* ignore */ }

      setSearchResults(results);
      setSearchOpen(results.length > 0);
    }, 300);
  }, [supabase]);

  const handleSearchSelect = useCallback((result: typeof searchResults[0]) => {
    if (result.center) {
      flyTo(result.center[0], result.center[1], 15);
    }
    setSearchOpen(false);
    setSearchQuery(result.text);
  }, [flyTo]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Map container */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Search bar - top center */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '100%', maxWidth: 520, padding: '0 16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
            borderRadius: 999, padding: '10px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(55, 65, 81, 0.5)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
              placeholder="Search address, owner name, or APN..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 14, fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search dropdown */}
          {searchOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
              background: 'rgba(15, 20, 40, 0.95)', backdropFilter: 'blur(12px)',
              borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(55, 65, 81, 0.5)',
            }}>
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSearchSelect(r)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 16px', border: 'none', background: 'transparent',
                    color: '#fff', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                    borderBottom: '1px solid rgba(55, 65, 81, 0.3)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 16 }}>
                    {r.type === 'address' ? '\u{1F4CD}' : r.type === 'parcel' ? '\u{1F3D8}\uFE0F' : '\u{1F464}'}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{r.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3D terrain toggle - top right */}
      <button
        onClick={toggle3D}
        title={terrain3D ? 'Switch to 2D' : 'Switch to 3D'}
        style={{
          position: 'absolute', top: 180, right: 16, zIndex: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
          borderRadius: 8, border: terrain3D ? '2px solid #3b82f6' : '1px solid rgba(55, 65, 81, 0.5)',
          cursor: 'pointer', color: terrain3D ? '#3b82f6' : '#94a3b8',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
        }}
      >
        {terrain3D ? '3D' : '2D'}
      </button>

      {/* Left sidebar */}
      <MapSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeMap={activeMapRecord}
        onSelectMap={handleSelectMap}
        onStyleChange={setStyle}
        onOverlayToggle={handleOverlayToggle}
      />

      {/* Active map badge */}
      {activeMapRecord && (
        <div style={{
          position: 'absolute', top: 16, left: sidebarOpen ? 336 : 56, zIndex: 10,
          background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
          borderRadius: 8, padding: '6px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)', border: '1px solid rgba(55, 65, 81, 0.5)',
          transition: 'left 0.3s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{activeMapRecord.title}</span>
        </div>
      )}

      {/* Drawing toolbar - left center (rich DrawToolbar with industrial tools) */}
      <DrawToolbar />

      {/* Feature Inspector - right slide panel */}
      <FeatureInspector />

      {/* Feature Properties Panel - appears after drawing */}
      <FeaturePropertiesPanel
        geometry={drawnGeometry}
        geometryType={drawnGeometryType}
        onComplete={handleDrawComplete}
      />

      {/* Status bar - bottom */}
      <MapStatusBar coordinates={coordinates} />
    </div>
  );
}
