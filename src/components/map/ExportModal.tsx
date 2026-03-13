'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileJson,
  Loader2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

// ── Types ────────────────────────────────────────────────────────────
type PaperSize = 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3';
type Orientation = 'landscape' | 'portrait';
type DataFormat = 'geojson' | 'kml';

const PAPER_SIZES: { id: PaperSize; label: string }[] = [
  { id: 'letter', label: 'Letter (8.5 x 11)' },
  { id: 'legal', label: 'Legal (8.5 x 14)' },
  { id: 'tabloid', label: 'Tabloid (11 x 17)' },
  { id: 'a4', label: 'A4 (210 x 297mm)' },
  { id: 'a3', label: 'A3 (297 x 420mm)' },
];

export default function ExportModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const activeMapId = useMapStore((s) => s.activeMapId);
  const layers = useMapStore((s) => s.layers);
  const annotations = useMapStore((s) => s.annotations);

  const isOpen = activeModal === 'export';

  // PDF tab state
  const [paperSize, setPaperSize] = useState<PaperSize>('letter');
  const [orientation, setOrientation] = useState<Orientation>('landscape');
  const [dpi, setDpi] = useState('150');
  const [includeTitle, setIncludeTitle] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeScale, setIncludeScale] = useState(true);
  const [includeNorthArrow, setIncludeNorthArrow] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [pdfExporting, setPdfExporting] = useState(false);

  // Data tab state
  const [dataFormat, setDataFormat] = useState<DataFormat>('geojson');
  const [selectedLayerIds, setSelectedLayerIds] = useState<Set<string>>(new Set());
  const [includeAnnotations, setIncludeAnnotations] = useState(true);

  const userLayers = layers.filter((l) => l.is_user_created);

  const toggleLayerSelection = (layerId: string) => {
    setSelectedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  // ── PDF export ─────────────────────────────────────────────────
  const handlePdfExport = async () => {
    if (!activeMapId) return;
    setPdfExporting(true);

    try {
      const response = await fetch(`/api/maps/${activeMapId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'pdf',
          paper_size: paperSize,
          orientation,
          dpi: parseInt(dpi, 10),
          elements: {
            title: includeTitle,
            legend: includeLegend,
            scale_bar: includeScale,
            north_arrow: includeNorthArrow,
            date: includeDate,
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map-export-${activeMapId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Handle error
    } finally {
      setPdfExporting(false);
    }
  };

  // ── Data export (client-side) ──────────────────────────────────
  const handleDataExport = () => {
    const features: GeoJSON.Feature[] = [];

    // Collect features from selected layers
    for (const layerId of Array.from(selectedLayerIds)) {
      const layer = layers.find((l) => l.id === layerId);
      if (layer?.source_config?.geojson) {
        const geojson = layer.source_config.geojson as GeoJSON.FeatureCollection;
        if (geojson.features) {
          features.push(...geojson.features);
        }
      }
    }

    // Collect annotations
    if (includeAnnotations) {
      for (const ann of annotations.filter((a) => !a.is_deleted)) {
        features.push({
          type: 'Feature',
          geometry: ann.geometry,
          properties: {
            id: ann.id,
            label: ann.label,
            notes: ann.notes,
            color: ann.color,
            geometry_type: ann.geometry_type,
            stroke_width: ann.stroke_width,
            fill_opacity: ann.fill_opacity,
            measurement: ann.measurement,
          },
        });
      }
    }

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    let content: string;
    let filename: string;
    let mimeType: string;

    if (dataFormat === 'geojson') {
      content = JSON.stringify(featureCollection, null, 2);
      filename = `map-data-${activeMapId || 'export'}.geojson`;
      mimeType = 'application/json';
    } else {
      // KML export
      content = featureCollectionToKml(featureCollection);
      filename = `map-data-${activeMapId || 'export'}.kml`;
      mimeType = 'application/vnd.google-earth.kml+xml';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Print ──────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-lg bg-[#1F2937] border-[#374151] text-[#F9FAFB]">
        <DialogHeader>
          <DialogTitle className="text-[#F9FAFB]">Export Map</DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Export your map as PDF, data files, or print directly.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pdf" className="mt-2">
          <TabsList className="bg-[#111827] w-full">
            <TabsTrigger value="pdf" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <FileText className="size-3.5 mr-1" /> PDF Map
            </TabsTrigger>
            <TabsTrigger value="data" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <FileJson className="size-3.5 mr-1" /> Data
            </TabsTrigger>
            <TabsTrigger value="print" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <Printer className="size-3.5 mr-1" /> Print
            </TabsTrigger>
          </TabsList>

          {/* ── PDF TAB ─────────────────────────────────────────── */}
          <TabsContent value="pdf" className="mt-3 space-y-4">
            {/* Paper size */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Paper Size</Label>
              <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                <SelectTrigger className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2937] border-[#374151]">
                  {PAPER_SIZES.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Orientation</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['landscape', 'portrait'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrientation(o)}
                    className={`rounded-md border px-3 py-2 text-xs capitalize transition-colors ${
                      orientation === o
                        ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF] bg-[#111827]'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* DPI */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">DPI</Label>
              <Select value={dpi} onValueChange={(v) => v && setDpi(v)}>
                <SelectTrigger className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2937] border-[#374151]">
                  <SelectItem value="72">72 (Screen)</SelectItem>
                  <SelectItem value="150">150 (Standard)</SelectItem>
                  <SelectItem value="300">300 (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Map elements */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Map Elements</Label>
              <div className="space-y-2">
                {[
                  { label: 'Title', checked: includeTitle, onChange: setIncludeTitle },
                  { label: 'Legend', checked: includeLegend, onChange: setIncludeLegend },
                  { label: 'Scale Bar', checked: includeScale, onChange: setIncludeScale },
                  { label: 'North Arrow', checked: includeNorthArrow, onChange: setIncludeNorthArrow },
                  { label: 'Date', checked: includeDate, onChange: setIncludeDate },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(v) => item.onChange(!!v)}
                    />
                    <span className="text-xs text-[#F9FAFB]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePdfExport}
              disabled={pdfExporting}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
            >
              {pdfExporting ? (
                <>
                  <Loader2 className="size-4 mr-1.5 animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <Download className="size-4 mr-1.5" /> Export PDF
                </>
              )}
            </Button>
          </TabsContent>

          {/* ── DATA TAB ────────────────────────────────────────── */}
          <TabsContent value="data" className="mt-3 space-y-4">
            {/* Format */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'geojson' as const, label: 'GeoJSON' },
                  { id: 'kml' as const, label: 'KML' },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDataFormat(f.id)}
                    className={`rounded-md border px-3 py-2 text-xs transition-colors ${
                      dataFormat === f.id
                        ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF] bg-[#111827]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer selection */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Include Layers</Label>
              <div className="space-y-2 rounded-md border border-[#374151] bg-[#111827] p-2.5 max-h-[200px] overflow-y-auto">
                {userLayers.length === 0 ? (
                  <p className="text-[11px] text-[#9CA3AF] italic">No user layers</p>
                ) : (
                  userLayers.map((layer) => (
                    <label key={layer.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedLayerIds.has(layer.id)}
                        onCheckedChange={() => toggleLayerSelection(layer.id)}
                      />
                      <span className="text-xs text-[#F9FAFB]">{layer.name}</span>
                    </label>
                  ))
                )}
                <Separator className="bg-[#374151] my-1" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={includeAnnotations}
                    onCheckedChange={(v) => setIncludeAnnotations(!!v)}
                  />
                  <span className="text-xs text-[#F9FAFB]">
                    Annotations ({annotations.filter((a) => !a.is_deleted).length})
                  </span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleDataExport}
              disabled={selectedLayerIds.size === 0 && !includeAnnotations}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
            >
              <Download className="size-4 mr-1.5" />
              Export {dataFormat.toUpperCase()}
            </Button>
          </TabsContent>

          {/* ── PRINT TAB ───────────────────────────────────────── */}
          <TabsContent value="print" className="mt-3 space-y-4">
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="rounded-full bg-[#F59E0B]/10 p-4">
                <Printer className="size-8 text-[#F59E0B]" />
              </div>
              <p className="text-sm text-[#9CA3AF] text-center max-w-xs">
                Opens your browser&apos;s print dialog with the current map view. For best results, use landscape orientation and set margins to minimum.
              </p>
            </div>

            <Button
              onClick={handlePrint}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
            >
              <Printer className="size-4 mr-1.5" />
              Print Map
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── KML conversion helper ────────────────────────────────────────────
function featureCollectionToKml(fc: GeoJSON.FeatureCollection): string {
  let placemarks = '';

  for (const feature of fc.features) {
    const name = (feature.properties?.label || feature.properties?.name || 'Feature') as string;
    const description = (feature.properties?.notes || '') as string;
    let geometryKml = '';

    if (feature.geometry.type === 'Point') {
      const [lng, lat, alt] = feature.geometry.coordinates;
      geometryKml = `<Point><coordinates>${lng},${lat}${alt ? `,${alt}` : ''}</coordinates></Point>`;
    } else if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates
        .map(([lng, lat, alt]) => `${lng},${lat}${alt ? `,${alt}` : ''}`)
        .join(' ');
      geometryKml = `<LineString><coordinates>${coords}</coordinates></LineString>`;
    } else if (feature.geometry.type === 'Polygon') {
      const ring = feature.geometry.coordinates[0]
        .map(([lng, lat, alt]) => `${lng},${lat}${alt ? `,${alt}` : ''}`)
        .join(' ');
      geometryKml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ring}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
    }

    placemarks += `
    <Placemark>
      <name>${escapeXml(name)}</name>
      <description>${escapeXml(description)}</description>
      ${geometryKml}
    </Placemark>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Map Export</name>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
