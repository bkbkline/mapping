'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMapInstance } from './MapInstanceContext';
import { useUIStore } from '@/store/uiStore';
import { useProjectStore } from '@/store/projectStore';
import { FolderPlus, Ruler, Copy, MapPin } from 'lucide-react';

interface MenuPosition {
  x: number;
  y: number;
  lngLat: { lng: number; lat: number };
}

export default function MapContextMenu() {
  const { map } = useMapInstance();
  const { openRightPanel } = useUIStore();
  const { activeProjectId } = useProjectStore();
  const [menu, setMenu] = useState<MenuPosition | null>(null);

  useEffect(() => {
    if (!map) return;

    const handleContextMenu = (e: mapboxgl.MapMouseEvent) => {
      e.preventDefault();
      setMenu({
        x: e.point.x,
        y: e.point.y,
        lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
      });
    };

    const handleClick = () => setMenu(null);

    map.on('contextmenu', handleContextMenu);
    map.on('click', handleClick);

    return () => {
      map.off('contextmenu', handleContextMenu);
      map.off('click', handleClick);
    };
  }, [map]);

  const handleCopyCoords = useCallback(() => {
    if (!menu) return;
    navigator.clipboard.writeText(`${menu.lngLat.lat.toFixed(6)}, ${menu.lngLat.lng.toFixed(6)}`);
    setMenu(null);
  }, [menu]);

  const handleMeasure = useCallback(() => {
    openRightPanel('feasibility');
    setMenu(null);
  }, [openRightPanel]);

  if (!menu) return null;

  return (
    <div
      className="absolute z-30 bg-[#1A1F36] border border-white/10 rounded-lg shadow-xl py-1 w-48"
      style={{ left: menu.x, top: menu.y }}
    >
      {activeProjectId && (
        <MenuItem icon={FolderPlus} label="Add to project" onClick={() => setMenu(null)} />
      )}
      <MenuItem icon={Ruler} label="Measure from here" onClick={handleMeasure} />
      <MenuItem icon={MapPin} label="Drop pin" onClick={() => setMenu(null)} />
      <MenuItem icon={Copy} label="Copy coordinates" onClick={handleCopyCoords} />
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
