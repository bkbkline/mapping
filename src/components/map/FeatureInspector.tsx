'use client';

import { useState, useEffect, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import {
  X,
  MapPin,
  FileText,
  ExternalLink,
  Download,
  Plus,
  Save,
  Undo2,
  Layers,
  Ruler,
  Info,
  Copy,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import * as turf from '@turf/turf';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import type { Annotation, Parcel, ZoningLookupEntry } from '@/types';

// ── Zoning quick reference data ──────────────────────────────────────
const ZONING_QUICK_REF: Record<string, ZoningLookupEntry> = {
  M1: {
    code: 'M1',
    description: 'Light Manufacturing',
    permitted_uses: ['Light manufacturing', 'Warehousing', 'Office', 'Research'],
    max_far: 2.0,
    max_lot_coverage: 0.65,
    min_setbacks: { front: 20, rear: 15, side: 10 },
    max_height: 45,
    industrial_compatibility: 'permitted',
  },
  M2: {
    code: 'M2',
    description: 'Heavy Manufacturing',
    permitted_uses: ['Heavy manufacturing', 'Warehousing', 'Distribution', 'Processing'],
    max_far: 2.5,
    max_lot_coverage: 0.75,
    min_setbacks: { front: 25, rear: 20, side: 15 },
    max_height: 60,
    industrial_compatibility: 'permitted',
  },
  C2: {
    code: 'C2',
    description: 'Commercial',
    permitted_uses: ['Retail', 'Office', 'Services', 'Mixed-use'],
    max_far: 3.0,
    max_lot_coverage: 0.80,
    min_setbacks: { front: 10, rear: 10, side: 5 },
    max_height: 75,
    industrial_compatibility: 'conditional',
  },
};

// ── Helper: format measurement ───────────────────────────────────────
function formatMeasurement(geometry: GeoJSON.Geometry | null | undefined) {
  if (!geometry) return null;
  try {
    const feature = turf.feature(geometry);
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      const areaSqM = turf.area(feature);
      const areaSqFt = areaSqM * 10.7639;
      const acres = areaSqFt / 43560;
      return { area: `${areaSqFt.toLocaleString(undefined, { maximumFractionDigits: 0 })} sq ft (${acres.toFixed(2)} acres)` };
    }
    if (geometry.type === 'LineString' || geometry.type === 'MultiLineString') {
      const lengthKm = turf.length(feature, { units: 'kilometers' });
      const lengthFt = lengthKm * 3280.84;
      const miles = lengthFt / 5280;
      return { length: `${lengthFt.toLocaleString(undefined, { maximumFractionDigits: 0 })} ft (${miles.toFixed(2)} mi)` };
    }
    if (geometry.type === 'Point') {
      const coords = (geometry as GeoJSON.Point).coordinates;
      return { coordinates: `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}` };
    }
  } catch {
    return null;
  }
  return null;
}

// ── Parcel inspector ─────────────────────────────────────────────────
function ParcelInspector({ parcel }: { parcel: Parcel | null }) {
  const [zoningOpen, setZoningOpen] = useState(false);

  if (!parcel) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
        <MapPin className="size-8 mb-2" />
        <p className="text-sm">Parcel data unavailable</p>
      </div>
    );
  }

  const zoningRef = parcel.zoning ? ZONING_QUICK_REF[parcel.zoning.toUpperCase()] : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <Badge variant="secondary" className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
          Parcel
        </Badge>
        {parcel.situs_address && (
          <h3 className="text-sm font-semibold text-[#F9FAFB]">{parcel.situs_address}</h3>
        )}
      </div>

      {/* Properties grid */}
      <div className="space-y-2">
        {[
          { label: 'APN', value: parcel.apn },
          { label: 'County', value: parcel.county },
          { label: 'State', value: parcel.state_abbr },
          { label: 'Acreage', value: parcel.acreage?.toFixed(2) },
          { label: 'Zoning', value: parcel.zoning },
          { label: 'Assessed Value', value: parcel.assessed_value ? `$${parcel.assessed_value.toLocaleString()}` : null },
          { label: 'Owner', value: parcel.owner_name },
          { label: 'Land Use', value: parcel.land_use_code },
        ]
          .filter((row) => row.value)
          .map((row) => (
            <div key={row.label} className="flex justify-between items-start gap-2">
              <span className="text-[11px] text-[#9CA3AF] shrink-0">{row.label}</span>
              <span className="text-[11px] text-[#F9FAFB] text-right">{row.value}</span>
            </div>
          ))}
      </div>

      {parcel.legal_description && (
        <>
          <Separator className="bg-[#374151]" />
          <div>
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Legal Description</Label>
            <p className="text-[11px] text-[#F9FAFB] mt-1 leading-relaxed">{parcel.legal_description}</p>
          </div>
        </>
      )}

      {/* Zoning quick reference */}
      {zoningRef && (
        <>
          <Separator className="bg-[#374151]" />
          <div>
            <button
              onClick={() => setZoningOpen(!zoningOpen)}
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#9CA3AF] hover:text-[#F9FAFB]"
            >
              {zoningOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Zoning Reference: {zoningRef.code}
            </button>
            {zoningOpen && (
              <div className="mt-2 space-y-1.5 rounded-md border border-[#374151] bg-[#111827] p-2.5">
                <p className="text-[11px] text-[#F9FAFB] font-medium">{zoningRef.description}</p>
                <div className="space-y-1">
                  {[
                    { label: 'Max FAR', value: zoningRef.max_far },
                    { label: 'Max Coverage', value: zoningRef.max_lot_coverage ? `${(zoningRef.max_lot_coverage * 100).toFixed(0)}%` : null },
                    { label: 'Max Height', value: zoningRef.max_height ? `${zoningRef.max_height} ft` : null },
                    { label: 'Front Setback', value: zoningRef.min_setbacks?.front ? `${zoningRef.min_setbacks.front} ft` : null },
                    { label: 'Rear Setback', value: zoningRef.min_setbacks?.rear ? `${zoningRef.min_setbacks.rear} ft` : null },
                    { label: 'Side Setback', value: zoningRef.min_setbacks?.side ? `${zoningRef.min_setbacks.side} ft` : null },
                  ]
                    .filter((r) => r.value != null)
                    .map((r) => (
                      <div key={r.label} className="flex justify-between text-[10px]">
                        <span className="text-[#9CA3AF]">{r.label}</span>
                        <span className="text-[#F9FAFB]">{r.value}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-1.5">
                  <span className="text-[10px] text-[#9CA3AF]">Permitted Uses:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {zoningRef.permitted_uses.map((use) => (
                      <Badge key={use} variant="outline" className="text-[9px] border-[#374151] text-[#9CA3AF]">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge
                  className={cn(
                    'text-[9px] mt-1',
                    zoningRef.industrial_compatibility === 'permitted' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    zoningRef.industrial_compatibility === 'conditional' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    zoningRef.industrial_compatibility === 'not_permitted' && 'bg-red-500/10 text-red-400 border-red-500/20'
                  )}
                  variant="outline"
                >
                  Industrial: {zoningRef.industrial_compatibility}
                </Badge>
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <Separator className="bg-[#374151]" />
      <div className="space-y-1.5">
        <Button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold" size="sm">
          <Plus className="size-3.5 mr-1" /> Add to Collection
        </Button>
        <Button variant="outline" className="w-full border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]" size="sm">
          <Download className="size-3.5 mr-1" /> Export PDF
        </Button>
        <Button variant="ghost" className="w-full text-[#9CA3AF] hover:text-[#F9FAFB]" size="sm">
          <ExternalLink className="size-3.5 mr-1" /> Open Full Profile
        </Button>
      </div>
    </div>
  );
}

// ── Annotation inspector ─────────────────────────────────────────────
function AnnotationInspector({ annotation }: { annotation: Annotation | null }) {
  const updateAnnotation = useMapStore((s) => s.updateAnnotation);
  const layers = useMapStore((s) => s.layers);
  const userLayers = layers.filter((l) => l.is_user_created);

  const [label, setLabel] = useState(annotation?.label ?? '');
  const [notes, setNotes] = useState(annotation?.notes ?? '');
  const [color, setColor] = useState(annotation?.color ?? '#F59E0B');
  const [strokeWidth, setStrokeWidth] = useState(annotation?.stroke_width ?? 2);
  const [fillOpacity, setFillOpacity] = useState(annotation?.fill_opacity ?? 0.3);
  const [layerId, setLayerId] = useState(annotation?.layer_id ?? '');
  const [dirty, setDirty] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  useEffect(() => {
    if (annotation) {
      setLabel(annotation.label ?? '');
      setNotes(annotation.notes ?? '');
      setColor(annotation.color);
      setStrokeWidth(annotation.stroke_width);
      setFillOpacity(annotation.fill_opacity);
      setLayerId(annotation.layer_id ?? '');
      setDirty(false);
    }
  }, [annotation]);

  const measurement = useMemo(
    () => formatMeasurement(annotation?.geometry),
    [annotation?.geometry]
  );

  if (!annotation) return null;

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    updateAnnotation(annotation.id, {
      label: label || null,
      notes: notes || null,
      color,
      stroke_width: strokeWidth,
      fill_opacity: fillOpacity,
      layer_id: layerId || null,
      updated_at: new Date().toISOString(),
    });
    setDirty(false);
  };

  const handleDiscard = () => {
    setLabel(annotation.label ?? '');
    setNotes(annotation.notes ?? '');
    setColor(annotation.color);
    setStrokeWidth(annotation.stroke_width);
    setFillOpacity(annotation.fill_opacity);
    setLayerId(annotation.layer_id ?? '');
    setDirty(false);
  };

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
        Annotation - {annotation.geometry_type}
      </Badge>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Label</Label>
        <Input
          value={label}
          onChange={(e) => { setLabel((e.target as HTMLInputElement).value); markDirty(); }}
          placeholder="Feature label"
          className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm h-7"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); markDirty(); }}
          placeholder="Add notes..."
          className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm min-h-[60px]"
        />
      </div>

      {/* Color picker */}
      <div className="space-y-1">
        <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Color</Label>
        <button
          onClick={() => setColorOpen(!colorOpen)}
          className="flex items-center gap-2 rounded-md border border-[#374151] bg-[#111827] px-2 py-1"
        >
          <div className="size-4 rounded-sm border border-[#374151]" style={{ backgroundColor: color }} />
          <span className="text-xs text-[#9CA3AF] font-mono">{color}</span>
        </button>
        {colorOpen && (
          <div className="mt-1">
            <HexColorPicker color={color} onChange={(c) => { setColor(c); markDirty(); }} />
          </div>
        )}
      </div>

      {/* Stroke width */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Stroke Width</Label>
          <span className="text-[10px] text-[#9CA3AF]">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          min={1}
          max={10}
          onValueChange={(v) => { setStrokeWidth(Array.isArray(v) ? v[0] : v); markDirty(); }}
        />
      </div>

      {/* Fill opacity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Fill Opacity</Label>
          <span className="text-[10px] text-[#9CA3AF]">{Math.round(fillOpacity * 100)}%</span>
        </div>
        <Slider
          value={[fillOpacity * 100]}
          min={0}
          max={100}
          onValueChange={(v) => { setFillOpacity((Array.isArray(v) ? v[0] : v) / 100); markDirty(); }}
        />
      </div>

      {/* Layer assignment */}
      <div className="space-y-1">
        <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Layer</Label>
        <Select value={layerId} onValueChange={(v) => { if (v) setLayerId(v); markDirty(); }}>
          <SelectTrigger className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs h-7 w-full">
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

      {/* Measurement */}
      {measurement && (
        <>
          <Separator className="bg-[#374151]" />
          <div className="space-y-1">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
              <Ruler className="size-3" /> Measurement
            </Label>
            {measurement.area && <p className="text-xs text-[#F9FAFB]">{measurement.area}</p>}
            {measurement.length && <p className="text-xs text-[#F9FAFB]">{measurement.length}</p>}
            {measurement.coordinates && <p className="text-xs text-[#F9FAFB]">{measurement.coordinates}</p>}
          </div>
        </>
      )}

      {/* Save / Discard */}
      {dirty && (
        <>
          <Separator className="bg-[#374151]" />
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold" size="sm">
              <Save className="size-3.5 mr-1" /> Save
            </Button>
            <Button onClick={handleDiscard} variant="outline" className="flex-1 border-[#374151] text-[#9CA3AF]" size="sm">
              <Undo2 className="size-3.5 mr-1" /> Discard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Layer feature inspector (GeoJSON properties) ─────────────────────
function LayerFeatureInspector({
  properties,
  geometry,
}: {
  properties: Record<string, unknown> | null;
  geometry: GeoJSON.Geometry | null;
}) {
  const measurement = useMemo(() => formatMeasurement(geometry), [geometry]);

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
        Layer Feature
      </Badge>

      {/* Properties table */}
      {properties && Object.keys(properties).length > 0 ? (
        <div className="rounded-md border border-[#374151] bg-[#111827] overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#374151]">
                <th className="text-left px-2 py-1 text-[#9CA3AF] font-medium">Property</th>
                <th className="text-left px-2 py-1 text-[#9CA3AF] font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(properties).map(([key, value]) => (
                <tr key={key} className="border-b border-[#374151] last:border-0">
                  <td className="px-2 py-1 text-[#9CA3AF] font-mono">{key}</td>
                  <td className="px-2 py-1 text-[#F9FAFB] break-all">
                    {value === null ? <span className="italic text-[#9CA3AF]">null</span> : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-[#9CA3AF] italic">No properties</p>
      )}

      {/* Geometry info */}
      {geometry && (
        <>
          <Separator className="bg-[#374151]" />
          <div className="space-y-1">
            <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider flex items-center gap-1">
              <Info className="size-3" /> Geometry
            </Label>
            <p className="text-xs text-[#F9FAFB]">Type: {geometry.type}</p>
            {measurement?.area && <p className="text-xs text-[#F9FAFB]">{measurement.area}</p>}
            {measurement?.length && <p className="text-xs text-[#F9FAFB]">{measurement.length}</p>}
            {measurement?.coordinates && <p className="text-xs text-[#F9FAFB]">{measurement.coordinates}</p>}
          </div>
        </>
      )}

      {/* Copy GeoJSON button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
        onClick={() => {
          const obj = { type: 'Feature', geometry, properties };
          navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
        }}
      >
        <Copy className="size-3.5 mr-1" /> Copy GeoJSON
      </Button>
    </div>
  );
}

// ── Main FeatureInspector component ──────────────────────────────────
export default function FeatureInspector() {
  const selectedFeatureId = useMapStore((s) => s.selectedFeatureId);
  const selectedFeatureType = useMapStore((s) => s.selectedFeatureType);
  const clearSelection = useMapStore((s) => s.clearSelection);
  const annotations = useMapStore((s) => s.annotations);
  const inspectorOpen = useUIStore((s) => s.inspectorOpen);
  const setInspectorOpen = useUIStore((s) => s.setInspectorOpen);

  const isOpen = !!selectedFeatureId && inspectorOpen;

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        clearSelection();
        setInspectorOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, clearSelection, setInspectorOpen]);

  // Auto-open inspector when feature selected
  useEffect(() => {
    if (selectedFeatureId) setInspectorOpen(true);
  }, [selectedFeatureId, setInspectorOpen]);

  const selectedAnnotation = useMemo(
    () => annotations.find((a) => a.id === selectedFeatureId) ?? null,
    [annotations, selectedFeatureId]
  );

  const handleClose = () => {
    clearSelection();
    setInspectorOpen(false);
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
          <FileText className="size-4 text-[#F59E0B]" />
          <h2 className="text-sm font-semibold text-[#F9FAFB]">Inspector</h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClose}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          {selectedFeatureType === 'parcel' && (
            <ParcelInspector parcel={null} />
          )}
          {selectedFeatureType === 'annotation' && (
            <AnnotationInspector annotation={selectedAnnotation} />
          )}
          {selectedFeatureType === 'layer_feature' && (
            <LayerFeatureInspector properties={null} geometry={null} />
          )}
          {!selectedFeatureType && (
            <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
              <Layers className="size-8 mb-2" />
              <p className="text-sm">Select a feature to inspect</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
