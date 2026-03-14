'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMapStore } from '@/store/mapStore';
import MapSidebar from './MapSidebar';
import MapToolbar from './MapToolbar';
import MapStatusBar from './MapStatusBar';
import type { MapRecord } from '@/types';

export default function MainMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [, setMapReady] = useState(false);
  const [coordinates, setCoordinates] = useState({ lng: -98.5, lat: 39.8, zoom: 4 });
  const [activeMapRecord, setActiveMapRecord] = useState<MapRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const supabase = createClient();
  useAuth();
  const { setMapLoaded, setViewport, setBasemap } = useMapStore();

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

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }), 'bottom-left');

    map.on('load', () => {
      setMapReady(true);
      setMapLoaded(true);
      setBasemap('satellite-streets-v12');
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

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 2000 });
  }, []);

  const setStyle = useCallback((styleId: string) => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(`mapbox://styles/mapbox/${styleId}`);
    setBasemap(styleId);
  }, [setBasemap]);

  const handleSelectMap = useCallback((rec: MapRecord) => {
    setActiveMapRecord(rec);
    flyTo(rec.center_lng, rec.center_lat, rec.zoom);
  }, [flyTo]);

  // Search bar
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

      // Geocode
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

      // Parcel search
      try {
        const { data: parcels } = await supabase
          .from('parcels')
          .select('id, apn, situs_address, owner_name, geometry')
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
                    {r.type === 'address' ? '📍' : r.type === 'parcel' ? '🏘️' : '👤'}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>{r.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Left sidebar */}
      <MapSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeMap={activeMapRecord}
        onSelectMap={handleSelectMap}
        mapInstance={mapRef.current}
        onStyleChange={setStyle}
      />

      {/* Active map badge - top left below sidebar toggle area */}
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

      {/* Drawing toolbar - left center */}
      <MapToolbar />

      {/* Status bar - bottom */}
      <MapStatusBar coordinates={coordinates} />
    </div>
  );
}
