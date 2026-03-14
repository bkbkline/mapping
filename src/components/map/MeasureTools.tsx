'use client';

import { useMapStore } from '@/store/mapStore';
import { Ruler, AreaChart, ArrowLeftRight } from 'lucide-react';
import type { DrawTool } from '@/types';

const tools: { tool: DrawTool; icon: React.ElementType; label: string }[] = [
  { tool: 'measure_distance', icon: Ruler, label: 'Distance' },
  { tool: 'measure_area', icon: AreaChart, label: 'Area' },
  { tool: 'buffer', icon: ArrowLeftRight, label: 'Frontage' },
];

export default function MeasureTools({ onClose }: { onClose: () => void }) {
  const { activeTool, setActiveTool } = useMapStore();

  return (
    <div className="bg-[#1A1F36] border border-white/10 rounded-lg shadow-xl p-2 w-40">
      <p className="text-xs text-gray-400 px-2 py-1 font-medium">Measure</p>
      {tools.map(({ tool, icon: Icon, label }) => (
        <button
          key={tool}
          onClick={() => {
            const newTool = activeTool === tool ? 'pan' : tool;
            setActiveTool(newTool);
            if (newTool === 'pan') onClose();
          }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
            activeTool === tool
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
