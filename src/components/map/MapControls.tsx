'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Minus,
  Compass,
  Locate,
  Maximize,
  Mountain,
  RotateCcw,
} from 'lucide-react';
import { useMap } from './MapContext';

export default function MapControls() {
  const map = useMap();
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track mouse coordinates
  useEffect(() => {
    if (!map) return;
    const handler = (e: mapboxgl.MapMouseEvent) => {
      setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };
    map.on('mousemove', handler);
    return () => {
      map.off('mousemove', handler);
    };
  }, [map]);

  // Track fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);

  const resetNorth = useCallback(() => {
    map?.easeTo({ bearing: 0, pitch: 0, duration: 500 });
  }, [map]);

  const geolocate = useCallback(() => {
    if (!map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
          duration: 1500,
        });
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true },
    );
  }, [map]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const toggle3D = useCallback(() => {
    if (!map) return;
    if (is3D) {
      map.easeTo({ pitch: 0, duration: 500 });
      // Remove terrain if present
      if (map.getSource('mapbox-dem')) {
        map.setTerrain(null);
      }
    } else {
      map.easeTo({ pitch: 60, duration: 500 });
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    }
    setIs3D(!is3D);
  }, [map, is3D]);

  const resetPitch = useCallback(() => {
    map?.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    setIs3D(false);
    if (map?.getSource('mapbox-dem')) {
      map.setTerrain(null);
    }
  }, [map]);

  const controlBtnClass =
    'flex h-8 w-8 items-center justify-center rounded bg-[#1F2937]/90 text-[#F9FAFB] hover:bg-[#374151] transition-colors cursor-pointer backdrop-blur-sm border border-[#374151]/50';

  return (
    <>
      {/* Top-right control cluster */}
      <div className="absolute right-3 top-16 z-10 flex flex-col gap-1">
        <button onClick={zoomIn} className={controlBtnClass} title="Zoom in">
          <Plus className="h-4 w-4" />
        </button>
        <button onClick={zoomOut} className={controlBtnClass} title="Zoom out">
          <Minus className="h-4 w-4" />
        </button>

        <div className="my-1" />

        <button onClick={resetNorth} className={controlBtnClass} title="Reset north">
          <Compass className="h-4 w-4" />
        </button>
        <button onClick={geolocate} className={controlBtnClass} title="My location">
          <Locate className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className={controlBtnClass}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          <Maximize className="h-4 w-4" />
        </button>

        <div className="my-1" />

        <button
          onClick={toggle3D}
          className={`${controlBtnClass} ${is3D ? 'ring-1 ring-[#F59E0B] text-[#F59E0B]' : ''}`}
          title="3D terrain"
        >
          <Mountain className="h-4 w-4" />
        </button>
        <button onClick={resetPitch} className={controlBtnClass} title="Reset pitch">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Bottom-left coordinate display */}
      <div className="absolute bottom-8 left-3 z-10">
        {coords && (
          <div className="rounded bg-[#1F2937]/90 px-2.5 py-1 text-xs font-mono text-[#9CA3AF] backdrop-blur-sm border border-[#374151]/50">
            {coords.lng.toFixed(6)}, {coords.lat.toFixed(6)}
          </div>
        )}
      </div>
    </>
  );
}
