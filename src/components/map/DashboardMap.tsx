'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';

interface DashboardMapProps {
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function DashboardMap({ onMapReady }: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const cbRef = useRef(onMapReady);
  cbRef.current = onMapReady;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = env.MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98.5, 39.8],
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }), 'bottom-left');

    map.on('load', () => cbRef.current?.(map));

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
    />
  );
}
