'use client';

import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useMapStore } from '@/store/mapStore';

interface ParcelLayerProps {
  map: mapboxgl.Map;
  onParcelClick: (parcelId: string) => void;
  onParcelHover: (parcelId: string | null) => void;
}

export default function ParcelLayer({ map, onParcelClick, onParcelHover }: ParcelLayerProps) {
  const { selectedParcelIds, mapLoaded } = useMapStore();

  useEffect(() => {
    if (!map || !mapLoaded) return;

    // Check if source already exists
    if (map.getSource('parcels')) return;

    // Add parcels source — this would typically be a vector tile source
    // For now, use a GeoJSON source that will be populated by search results
    map.addSource('parcels', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    // Fill layer
    map.addLayer({
      id: 'parcels-fill',
      type: 'fill',
      source: 'parcels',
      paint: {
        'fill-color': [
          'case',
          ['in', ['get', 'id'], ['literal', selectedParcelIds]],
          '#3B82F6',
          'rgba(59, 130, 246, 0.1)',
        ],
        'fill-opacity': 0.4,
      },
    });

    // Line layer
    map.addLayer({
      id: 'parcels-line',
      type: 'line',
      source: 'parcels',
      paint: {
        'line-color': [
          'case',
          ['in', ['get', 'id'], ['literal', selectedParcelIds]],
          '#3B82F6',
          '#60A5FA',
        ],
        'line-width': [
          'case',
          ['in', ['get', 'id'], ['literal', selectedParcelIds]],
          2.5,
          1,
        ],
      },
    });

    // Click handler
    map.on('click', 'parcels-fill', (e) => {
      if (e.features?.[0]?.properties?.id) {
        onParcelClick(e.features[0].properties.id);
      }
    });

    // Hover handler
    map.on('mousemove', 'parcels-fill', (e) => {
      if (e.features?.[0]?.properties?.id) {
        onParcelHover(e.features[0].properties.id);
      }
    });

    map.on('mouseleave', 'parcels-fill', () => {
      onParcelHover(null);
    });
  }, [map, mapLoaded, selectedParcelIds, onParcelClick, onParcelHover]);

  // Update selection styling
  useEffect(() => {
    if (!map || !map.getLayer('parcels-fill')) return;
    map.setPaintProperty('parcels-fill', 'fill-color', [
      'case',
      ['in', ['get', 'id'], ['literal', selectedParcelIds.length > 0 ? selectedParcelIds : ['__none__']]],
      '#3B82F6',
      'rgba(59, 130, 246, 0.1)',
    ]);
  }, [map, selectedParcelIds]);

  return null;
}
