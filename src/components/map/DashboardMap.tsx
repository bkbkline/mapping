'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { env } from '@/lib/env';

interface DashboardMapProps {
  /** Called once the map instance is ready */
  onMapReady?: (map: mapboxgl.Map) => void;
}

export default function DashboardMap({ onMapReady }: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;

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

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
      'bottom-right',
    );
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      'bottom-left',
    );
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 150, unit: 'imperial' }),
      'bottom-left',
    );

    map.on('load', () => {
      onMapReadyRef.current?.(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
