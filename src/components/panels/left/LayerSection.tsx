'use client';

import { useLayers } from '@/hooks/useLayers';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function LayerSection() {
  const { groupedLayers, toggleLayer, setLayerOpacity } = useLayers();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Base Layers': true,
    'My Layers': true,
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white">Layers</h3>

      {groupedLayers.map((group) => (
        <div key={group.label}>
          <button
            onClick={() => toggleGroup(group.label)}
            className="flex items-center gap-1.5 w-full text-left py-1"
          >
            {expandedGroups[group.label] ? (
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span className="text-xs font-medium text-gray-300">{group.label}</span>
            <span className="text-[10px] text-gray-500 ml-auto">{group.layers.length}</span>
          </button>

          {expandedGroups[group.label] && (
            <div className="space-y-1 ml-2 mt-1">
              {group.layers.length === 0 && (
                <p className="text-xs text-gray-500 py-1">No layers</p>
              )}
              {group.layers.map((layer) => (
                <div key={layer.id} className="rounded-md p-2 hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {layer.is_visible ? (
                        <Eye className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                      )}
                      <span className="text-xs text-white truncate">{layer.name}</span>
                    </div>
                    <Switch
                      checked={layer.is_visible}
                      onCheckedChange={() => toggleLayer(layer.id)}
                      className="scale-75"
                    />
                  </div>
                  {layer.is_visible && (
                    <div className="mt-2 flex items-center gap-2 ml-5">
                      <Label className="text-[10px] text-gray-500 shrink-0">Opacity</Label>
                      <Slider
                        value={[layer.opacity * 100]}
                        onValueChange={(vals) => setLayerOpacity(layer.id, (Array.isArray(vals) ? vals[0] : vals) / 100)}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-[10px] text-gray-500 w-8 text-right">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <Separator className="bg-white/5 mt-2" />
        </div>
      ))}
    </div>
  );
}
