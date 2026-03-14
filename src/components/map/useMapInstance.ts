'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { env } from '@/lib/env';
import { useMapStore } from '@/store/mapStore';
import { useMapInstance } from './MapInstanceContext';

export function useMapSetup() {
  const { setMap, containerRef } = useMapInstance();
  const { viewport, basemap, setViewport, setMapLoaded } = useMapStore();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !containerRef.current) return;
    initialized.current = true;

    mapboxgl.accessToken = env.MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: `mapbox://styles/mapbox/${basemap}`,
      center: viewport.center,
      zoom: viewport.zoom,
      bearing: viewport.bearing,
      pitch: viewport.pitch,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('moveend', () => {
      const center = map.getCenter();
      setViewport({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    mapRef.current = map;
    setMap(map);

    return () => {
      map.remove();
      mapRef.current = null;
      setMap(null);
      setMapLoaded(false);
      initialized.current = false;
    };
    // Only run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return mapRef;
}
