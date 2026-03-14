'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/store/mapStore';

export default function DrawingLayer({ map }: { map: mapboxgl.Map }) {
  const { annotations, mapLoaded } = useMapStore();

  useEffect(() => {
    if (!map || !mapLoaded) return;
    if (map.getSource('drawings')) return;

    map.addSource('drawings', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    map.addLayer({
      id: 'drawings-fill',
      type: 'fill',
      source: 'drawings',
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['coalesce', ['get', 'fill_opacity'], 0.3],
      },
    });

    map.addLayer({
      id: 'drawings-line',
      type: 'line',
      source: 'drawings',
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#3B82F6'],
        'line-width': ['coalesce', ['get', 'stroke_width'], 2],
      },
    });

    map.addLayer({
      id: 'drawings-point',
      type: 'circle',
      source: 'drawings',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': ['coalesce', ['get', 'color'], '#3B82F6'],
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });
  }, [map, mapLoaded]);

  // Update drawings data
  useEffect(() => {
    if (!map || !map.getSource('drawings')) return;
    const activeAnnotations = annotations.filter((a) => !a.is_deleted);
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: activeAnnotations.map((a) => ({
        type: 'Feature' as const,
        geometry: a.geometry,
        properties: {
          id: a.id,
          color: a.color,
          stroke_width: a.stroke_width,
          fill_opacity: a.fill_opacity,
          label: a.label,
        },
      })),
    };
    (map.getSource('drawings') as mapboxgl.GeoJSONSource).setData(fc);
  }, [map, annotations]);

  return null;
}
