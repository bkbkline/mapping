'use client';

import { useCallback } from 'react';
import { useMapInstance } from './MapInstanceContext';
import { useMapSetup } from './useMapInstance';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import MapTooltip from './MapTooltip';
import MapContextMenu from './MapContextMenu';
import ParcelLayer from './ParcelLayer';
import CompLayer from './CompLayer';
import DrawingLayer from './DrawingLayer';

export default function MapCanvas() {
  const { containerRef, map } = useMapInstance();
  useMapSetup();
  const { selectFeature, setHoveredParcelId } = useMapStore();
  const { openRightPanel } = useUIStore();

  const handleParcelClick = useCallback((parcelId: string) => {
    selectFeature(parcelId, 'parcel');
    openRightPanel('parcel');
  }, [selectFeature, openRightPanel]);

  const handleParcelHover = useCallback((parcelId: string | null) => {
    setHoveredParcelId(parcelId);
  }, [setHoveredParcelId]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {map && (
        <>
          <ParcelLayer map={map} onParcelClick={handleParcelClick} onParcelHover={handleParcelHover} />
          <CompLayer map={map} />
          <DrawingLayer map={map} />
          <MapTooltip map={map} />
          <MapContextMenu />
        </>
      )}
    </div>
  );
}
