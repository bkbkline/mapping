'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/store/mapStore';

export default function CompLayer({ map }: { map: mapboxgl.Map }) {
  const { mapLoaded } = useMapStore();

  useEffect(() => {
    if (!map || !mapLoaded) return;
    if (map.getSource('comps')) return;

    map.addSource('comps', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Cluster circles
    map.addLayer({
      id: 'comps-clusters',
      type: 'circle',
      source: 'comps',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#10B981',
        'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 50, 25],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    });

    // Cluster count labels
    map.addLayer({
      id: 'comps-cluster-count',
      type: 'symbol',
      source: 'comps',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 11,
      },
      paint: {
        'text-color': '#fff',
      },
    });

    // Individual comp points
    map.addLayer({
      id: 'comps-unclustered',
      type: 'circle',
      source: 'comps',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#10B981',
        'circle-radius': 6,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
      },
    });
  }, [map, mapLoaded]);

  return null;
}
