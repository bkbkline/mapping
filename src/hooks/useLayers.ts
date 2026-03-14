'use client';

import { useCallback } from 'react';
import { useMapStore } from '@/store/mapStore';
import type { MapLayer } from '@/types';

interface LayerGroup {
  label: string;
  layers: MapLayer[];
}

export function useLayers() {
  const { layers, toggleLayerVisibility, setOpacity, addLayer, removeLayer } = useMapStore();

  const systemLayers = layers.filter((l) => !l.is_user_created);
  const userLayers = layers.filter((l) => l.is_user_created);

  const groupedLayers: LayerGroup[] = [
    { label: 'Base Layers', layers: systemLayers },
    { label: 'My Layers', layers: userLayers },
  ];

  const toggleLayer = useCallback((layerId: string) => {
    toggleLayerVisibility(layerId);
  }, [toggleLayerVisibility]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setOpacity(layerId, opacity);
  }, [setOpacity]);

  return {
    layers,
    systemLayers,
    userLayers,
    groupedLayers,
    toggleLayer,
    setLayerOpacity,
    addLayer,
    removeLayer,
  };
}
