'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/store/mapStore';

export default function ListingLayer({ map }: { map: mapboxgl.Map }) {
  const { mapLoaded } = useMapStore();

  useEffect(() => {
    if (!map || !mapLoaded) return;
    if (map.getSource('listings')) return;

    map.addSource('listings', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: 'listings-clusters',
      type: 'circle',
      source: 'listings',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#F59E0B',
        'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 25],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    map.addLayer({
      id: 'listings-cluster-count',
      type: 'symbol',
      source: 'listings',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 11,
      },
      paint: {
        'text-color': '#fff',
      },
    });

    map.addLayer({
      id: 'listings-unclustered',
      type: 'circle',
      source: 'listings',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#F59E0B',
        'circle-radius': 6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
      },
    });
  }, [map, mapLoaded]);

  return null;
}
