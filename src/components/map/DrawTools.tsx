'use client';

import { useMapStore } from '@/store/mapStore';
import { MousePointer2, Pentagon, Square, Circle, Minus, MapPin } from 'lucide-react';
import type { DrawingMode } from '@/types';

const tools: { mode: DrawingMode | null; icon: React.ElementType; label: string }[] = [
  { mode: null, icon: MousePointer2, label: 'Pan' },
  { mode: 'point', icon: MapPin, label: 'Point' },
  { mode: 'line', icon: Minus, label: 'Line' },
  { mode: 'polygon', icon: Pentagon, label: 'Polygon' },
  { mode: 'rectangle', icon: Square, label: 'Rectangle' },
  { mode: 'circle', icon: Circle, label: 'Circle' },
];

export default function DrawTools({ onClose }: { onClose: () => void }) {
  const { drawingMode, setDrawingMode } = useMapStore();

  const handleSelect = (mode: DrawingMode | null) => {
    setDrawingMode(mode);
    if (!mode) onClose();
  };

  return (
    <div className="bg-[#1A1F36] border border-white/10 rounded-lg shadow-xl p-2 w-40">
      <p className="text-xs text-gray-400 px-2 py-1 font-medium">Draw</p>
      {tools.map(({ mode, icon: Icon, label }) => (
        <button
          key={label}
          onClick={() => handleSelect(mode)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
            drawingMode === mode
              ? 'bg-blue-600/20 text-blue-400'
              : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
