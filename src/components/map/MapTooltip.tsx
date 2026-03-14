'use client';

import { useEffect, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

interface TooltipData {
  x: number;
  y: number;
  apn: string;
  acreage: string;
  zoning: string;
}

export default function MapTooltip({ map }: { map: mapboxgl.Map }) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['parcels-fill'] });
      if (features.length > 0) {
        const f = features[0];
        setTooltip({
          x: e.point.x,
          y: e.point.y,
          apn: f.properties?.apn || 'N/A',
          acreage: f.properties?.acreage ? `${Number(f.properties.acreage).toFixed(2)} ac` : 'N/A',
          zoning: f.properties?.zoning || 'N/A',
        });
        map.getCanvas().style.cursor = 'pointer';
      } else {
        setTooltip(null);
        map.getCanvas().style.cursor = '';
      }
    };

    const handleMouseLeave = () => setTooltip(null);

    map.on('mousemove', handleMouseMove);
    map.on('mouseleave', 'parcels-fill', handleMouseLeave);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseleave', 'parcels-fill', handleMouseLeave);
    };
  }, [map]);

  if (!tooltip) return null;

  return (
    <div
      className="absolute z-20 pointer-events-none bg-[#1A1F36] border border-white/20 rounded-md px-2.5 py-1.5 shadow-lg"
      style={{ left: tooltip.x + 12, top: tooltip.y - 12 }}
    >
      <p className="text-xs text-white font-medium">{tooltip.apn}</p>
      <p className="text-[10px] text-gray-400">
        {tooltip.acreage} · {tooltip.zoning}
      </p>
    </div>
  );
}
