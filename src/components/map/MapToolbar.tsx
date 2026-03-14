'use client';

import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import type { DrawTool } from '@/types';

const tools: Array<{ id: DrawTool; label: string; icon: string; shortcut: string }> = [
  { id: 'pan', label: 'Select', icon: '🖱️', shortcut: 'V' },
  { id: 'point', label: 'Waypoint', icon: '📍', shortcut: 'M' },
  { id: 'polygon', label: 'Draw Polygon', icon: '⬡', shortcut: 'P' },
  { id: 'line', label: 'Draw Line', icon: '〰️', shortcut: 'L' },
  { id: 'measure_distance', label: 'Measure Distance', icon: '📏', shortcut: 'D' },
  { id: 'measure_area', label: 'Measure Area', icon: '📐', shortcut: 'A' },
];

export default function MapToolbar() {
  const { activeTool, setActiveTool } = useMapStore();
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);

  return (
    <div style={{
      position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
      background: 'rgba(15, 20, 40, 0.92)', backdropFilter: 'blur(12px)',
      borderRadius: 12, padding: 6,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '1px solid rgba(55, 65, 81, 0.5)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {tools.map((tool) => (
        <div key={tool.id} style={{ position: 'relative' }}>
          <button
            onClick={() => setActiveTool(tool.id)}
            onMouseEnter={() => setHoveredTool(tool.id)}
            onMouseLeave={() => setHoveredTool(null)}
            style={{
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 18,
              background: activeTool === tool.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              color: activeTool === tool.id ? '#3b82f6' : '#94a3b8',
              transition: 'all 0.15s',
            }}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
          </button>
          {hoveredTool === tool.id && (
            <div style={{
              position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
              marginLeft: 8, whiteSpace: 'nowrap',
              background: 'rgba(15, 20, 40, 0.95)', padding: '6px 10px', borderRadius: 6,
              color: '#fff', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '1px solid rgba(55, 65, 81, 0.4)',
              pointerEvents: 'none',
            }}>
              {tool.label} <span style={{ color: '#94a3b8', marginLeft: 4 }}>{tool.shortcut}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
