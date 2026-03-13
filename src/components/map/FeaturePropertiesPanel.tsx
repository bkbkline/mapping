'use client';

import { useState, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  X,
  Save,
  Trash2,
  Ruler,
  PenTool,
} from 'lucide-react';
import * as turf from '@turf/turf';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/store/mapStore';
import { createClient } from '@/lib/supabase/client';
import type { Annotation, GeometryType } from '@/types';

interface FeaturePropertiesPanelProps {
  /** The drawn geometry to save as an annotation */
  geometry: GeoJSON.Geometry | null;
  /** The geometry type that was drawn */
  geometryType: GeometryType | null;
  /** Called when the drawing is saved or discarded */
  onComplete: () => void;
}

// ── Measurement formatter ────────────────────────────────────────────
function formatMeasurement(geometry: GeoJSON.Geometry | null) {
  if (!geometry) return null;
  try {
    const feat = turf.feature(geometry);
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      const areaSqM = turf.area(feat);
      const areaSqFt = areaSqM * 10.7639;
      const acres = areaSqFt / 43560;
      return {
        type: 'area' as const,
        primary: `${areaSqFt.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft`,
        secondary: `${acres.toFixed(2)} acres`,
      };
    }
    if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
      const lengthKm = turf.length(feat, { units: 'kilometers' });
      const lengthFt = lengthKm * 3280.84;
      const miles = lengthFt / 5280;
      return {
        type: 'length' as const,
        primary: `${lengthFt.toLocaleString(undefined, { maximumFractionDigits: 0 })} ft`,
        secondary: `${miles.toFixed(2)} mi`,
      };
    }
    if (geometry.type === 'Point') {
      const coords = (geometry as GeoJSON.Point).coordinates;
      return {
        type: 'point' as const,
        primary: `${coords[1].toFixed(6)}`,
        secondary: `${coords[0].toFixed(6)}`,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export default function FeaturePropertiesPanel({
  geometry,
  geometryType,
  onComplete,
}: FeaturePropertiesPanelProps) {
  const activeMapId = useMapStore((s) => s.activeMapId);
  const addAnnotation = useMapStore((s) => s.addAnnotation);
  const layers = useMapStore((s) => s.layers);
  const userLayers = layers.filter((l) => l.is_user_created);

  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#F59E0B');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillOpacity, setFillOpacity] = useState(0.3);
  const [layerId, setLayerId] = useState('');
  const [colorOpen, setColorOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const measurement = useMemo(() => formatMeasurement(geometry), [geometry]);
  const isOpen = !!geometry;

  const handleSave = async () => {
    if (!geometry || !geometryType || !activeMapId) return;
    setSaving(true);

    try {
      const annotation: Annotation = {
        id: crypto.randomUUID(),
        map_id: activeMapId,
        owner_id: null,
        geometry,
        geometry_type: geometryType,
        label: label || null,
        notes: notes || null,
        color,
        stroke_width: strokeWidth,
        fill_opacity: fillOpacity,
        icon: null,
        media_urls: [],
        measurement: measurement
          ? { type: measurement.type, primary: measurement.primary, secondary: measurement.secondary }
          : null,
        layer_id: layerId || null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Persist to Supabase
      try {
        const supabase = createClient();
        await supabase.from('annotations').insert({
          id: annotation.id,
          map_id: annotation.map_id,
          geometry: annotation.geometry,
          geometry_type: annotation.geometry_type,
          label: annotation.label,
          notes: annotation.notes,
          color: annotation.color,
          stroke_width: annotation.stroke_width,
          fill_opacity: annotation.fill_opacity,
          measurement: annotation.measurement,
          layer_id: annotation.layer_id,
        });
      } catch {
        // Supabase write is best-effort; store update still happens
      }

      addAnnotation(annotation);
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    onComplete();
  };

  return (
    <div
      className={cn(
        'fixed top-0 right-0 z-40 h-full w-80 bg-[#0A0E1A] border-l border-[#374151] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
        <div className="flex items-center gap-2">
          <PenTool className="size-4 text-[#F59E0B]" />
          <h2 className="text-sm font-semibold text-[#F9FAFB]">
            New {geometryType || 'Feature'}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDiscard}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-4 py-3 space-y-4">
          {/* Measurement display */}
          {measurement && (
            <div className="rounded-md border border-[#374151] bg-[#111827] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Ruler className="size-3.5 text-[#F59E0B]" />
                <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-medium">
                  {measurement.type === 'area' ? 'Area' : measurement.type === 'length' ? 'Length' : 'Coordinates'}
                </span>
              </div>
              <p className="text-lg font-semibold text-[#F9FAFB]">{measurement.primary}</p>
              <p className="text-sm text-[#9CA3AF]">{measurement.secondary}</p>
            </div>
          )}

          {/* Label */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel((e.target as HTMLInputElement).value)}
              placeholder="Feature label"
              className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm"
              autoFocus
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm min-h-[80px]"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Color</Label>
            <button
              onClick={() => setColorOpen(!colorOpen)}
              className="flex items-center gap-2 rounded-md border border-[#374151] bg-[#111827] px-2.5 py-1.5 w-full"
            >
              <div className="size-5 rounded border border-[#374151]" style={{ backgroundColor: color }} />
              <span className="text-xs text-[#9CA3AF] font-mono">{color}</span>
            </button>
            {colorOpen && (
              <div className="mt-1">
                <HexColorPicker color={color} onChange={setColor} />
              </div>
            )}
          </div>

          {/* Stroke width */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Stroke Width</Label>
              <span className="text-[10px] text-[#9CA3AF]">{strokeWidth}px</span>
            </div>
            <Slider
              value={[strokeWidth]}
              min={1}
              max={10}
              onValueChange={(v) => setStrokeWidth(Array.isArray(v) ? v[0] : v)}
            />
          </div>

          {/* Fill opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Fill Opacity</Label>
              <span className="text-[10px] text-[#9CA3AF]">{Math.round(fillOpacity * 100)}%</span>
            </div>
            <Slider
              value={[fillOpacity * 100]}
              min={0}
              max={100}
              onValueChange={(v) => setFillOpacity((Array.isArray(v) ? v[0] : v) / 100)}
            />
          </div>

          {/* Layer assignment */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Assign to Layer</Label>
            <Select value={layerId} onValueChange={(v) => v && setLayerId(v)}>
              <SelectTrigger className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs w-full">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-[#1F2937] border-[#374151]">
                <SelectItem value="">Unassigned</SelectItem>
                {userLayers.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[#374151] space-y-2">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
        >
          <Save className="size-4 mr-1.5" />
          {saving ? 'Saving...' : 'Save Annotation'}
        </Button>
        <Button
          onClick={handleDiscard}
          variant="outline"
          className="w-full border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          <Trash2 className="size-4 mr-1.5" />
          Discard
        </Button>
      </div>
    </div>
  );
}
