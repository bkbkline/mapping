'use client';

import { useCallback, useEffect } from 'react';
import {
  MousePointer,
  Pentagon,
  Square,
  Circle,
  Minus,
  MapPin,
  Ruler,
  Scan,
  Maximize2,
  Trash2,
  ArrowUpFromLine,
  ParkingSquare,
  Truck,
  Building2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/store/mapStore';
import type { DrawTool } from '@/types';

interface ToolDef {
  id: DrawTool;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
  group: 'draw' | 'measure' | 'industrial';
}

const TOOLS: ToolDef[] = [
  // Drawing tools
  { id: 'pan', label: 'Pan', icon: <MousePointer className="size-4" />, shortcut: 'V', group: 'draw' },
  { id: 'polygon', label: 'Polygon', icon: <Pentagon className="size-4" />, shortcut: 'P', group: 'draw' },
  { id: 'rectangle', label: 'Rectangle', icon: <Square className="size-4" />, shortcut: 'R', group: 'draw' },
  { id: 'circle', label: 'Circle', icon: <Circle className="size-4" />, shortcut: 'C', group: 'draw' },
  { id: 'line', label: 'Line', icon: <Minus className="size-4" />, shortcut: 'L', group: 'draw' },
  { id: 'point', label: 'Point', icon: <MapPin className="size-4" />, shortcut: 'M', group: 'draw' },
  // Measure tools
  { id: 'measure_distance', label: 'Measure Distance', icon: <Ruler className="size-4" />, shortcut: 'D', group: 'measure' },
  { id: 'measure_area', label: 'Measure Area', icon: <Scan className="size-4" />, shortcut: 'A', group: 'measure' },
  { id: 'buffer', label: 'Buffer', icon: <Maximize2 className="size-4" />, shortcut: 'B', group: 'measure' },
  // Industrial tools
  { id: 'setback_buffer', label: 'Setback Buffer', icon: <ArrowUpFromLine className="size-4" />, shortcut: 'S', group: 'industrial' },
  { id: 'parking_calc', label: 'Parking Calc', icon: <ParkingSquare className="size-4" />, shortcut: 'K', group: 'industrial' },
  { id: 'truck_court', label: 'Truck Court', icon: <Truck className="size-4" />, shortcut: 'T', group: 'industrial' },
  { id: 'building_area', label: 'Building Area', icon: <Building2 className="size-4" />, shortcut: 'G', group: 'industrial' },
];

const DELETE_ACTION = {
  label: 'Delete Selected',
  icon: <Trash2 className="size-4" />,
  shortcut: 'Del',
};

const SHORTCUT_MAP: Record<string, DrawTool> = {};
TOOLS.forEach((t) => {
  SHORTCUT_MAP[t.shortcut.toLowerCase()] = t.id;
});

export default function DrawToolbar() {
  const activeTool = useMapStore((s) => s.activeTool);
  const setActiveTool = useMapStore((s) => s.setActiveTool);
  const selectedFeatureId = useMapStore((s) => s.selectedFeatureId);
  const deleteAnnotation = useMapStore((s) => s.deleteAnnotation);

  const handleDeleteSelected = useCallback(() => {
    if (selectedFeatureId) {
      deleteAnnotation(selectedFeatureId);
    }
  }, [selectedFeatureId, deleteAnnotation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
        return;
      }

      const tool = SHORTCUT_MAP[e.key.toLowerCase()];
      if (tool) {
        e.preventDefault();
        setActiveTool(tool);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool, handleDeleteSelected]);

  const drawTools = TOOLS.filter((t) => t.group === 'draw');
  const measureTools = TOOLS.filter((t) => t.group === 'measure');
  const industrialTools = TOOLS.filter((t) => t.group === 'industrial');

  const renderToolButton = (tool: ToolDef) => (
    <Tooltip key={tool.id}>
      <TooltipTrigger
        onClick={() => setActiveTool(tool.id)}
        className={cn(
          'flex items-center justify-center size-9 rounded-md transition-colors',
          activeTool === tool.id
            ? 'bg-[#F59E0B] text-[#0A0E1A]'
            : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#374151]'
        )}
      >
        {tool.icon}
      </TooltipTrigger>
      <TooltipContent side="right" className="bg-[#1F2937] text-[#F9FAFB] border border-[#374151]">
        <span>{tool.label}</span>
        <kbd className="ml-2 rounded bg-[#374151] px-1.5 py-0.5 text-[10px] font-mono text-[#9CA3AF]">
          {tool.shortcut}
        </kbd>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider>
      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-0.5 rounded-lg border border-[#374151] bg-[#0A0E1A]/95 p-1 shadow-xl backdrop-blur-sm">
        {/* Draw tools */}
        {drawTools.map(renderToolButton)}

        {/* Separator */}
        <div className="mx-1.5 my-0.5 h-px bg-[#374151]" />

        {/* Measure tools */}
        {measureTools.map(renderToolButton)}

        {/* Separator */}
        <div className="mx-1.5 my-0.5 h-px bg-[#374151]" />

        {/* Industrial tools */}
        {industrialTools.map(renderToolButton)}

        {/* Separator */}
        <div className="mx-1.5 my-0.5 h-px bg-[#374151]" />

        {/* Delete */}
        <Tooltip>
          <TooltipTrigger
            onClick={handleDeleteSelected}
            disabled={!selectedFeatureId}
            className={cn(
              'flex items-center justify-center size-9 rounded-md transition-colors',
              selectedFeatureId
                ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                : 'text-[#374151] cursor-not-allowed'
            )}
          >
            {DELETE_ACTION.icon}
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1F2937] text-[#F9FAFB] border border-[#374151]">
            <span>{DELETE_ACTION.label}</span>
            <kbd className="ml-2 rounded bg-[#374151] px-1.5 py-0.5 text-[10px] font-mono text-[#9CA3AF]">
              {DELETE_ACTION.shortcut}
            </kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
