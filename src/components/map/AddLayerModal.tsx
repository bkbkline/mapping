'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Link2,
  LayoutGrid,
  PenTool,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Building2,
  TreePine,
  Truck,
  Landmark,
  Factory,
} from 'lucide-react';
import { kml } from '@tmcw/togeojson';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import { createClient } from '@/lib/supabase/client';
import type { MapLayer, LayerType } from '@/types';

// ── Preset definitions ───────────────────────────────────────────────
interface PresetCard {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  layer_type: LayerType;
  source_config: Record<string, unknown>;
}

const PRESETS: PresetCard[] = [
  {
    id: 'us_parcels',
    name: 'US Parcels',
    category: 'Reference',
    icon: <MapPin className="size-5" />,
    layer_type: 'mapbox_tileset',
    source_config: { url: 'mapbox://mapbox.boundaries-par-v4' },
  },
  {
    id: 'buildings',
    name: 'Building Footprints',
    category: 'Reference',
    icon: <Building2 className="size-5" />,
    layer_type: 'mapbox_tileset',
    source_config: { url: 'mapbox://microsoft.buildingfootprints' },
  },
  {
    id: 'usgs_topo',
    name: 'USGS Topographic',
    category: 'Reference',
    icon: <Globe className="size-5" />,
    layer_type: 'xyz_tile',
    source_config: { url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}' },
  },
  {
    id: 'fema_flood',
    name: 'FEMA Flood Zones',
    category: 'Environmental',
    icon: <AlertCircle className="size-5" />,
    layer_type: 'wms',
    source_config: { url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/export' },
  },
  {
    id: 'wetlands',
    name: 'Wetlands (NWI)',
    category: 'Environmental',
    icon: <TreePine className="size-5" />,
    layer_type: 'wms',
    source_config: { url: 'https://www.fws.gov/wetlands/arcgis/services/Wetlands/MapServer/WMSServer' },
  },
  {
    id: 'highways',
    name: 'Highway Network',
    category: 'Transportation',
    icon: <Truck className="size-5" />,
    layer_type: 'xyz_tile',
    source_config: { url: 'https://tiles.arcgis.com/tiles/highway/{z}/{x}/{y}.pbf' },
  },
  {
    id: 'rail',
    name: 'Rail Lines',
    category: 'Transportation',
    icon: <Factory className="size-5" />,
    layer_type: 'geojson',
    source_config: { url: 'https://data-usdot.opendata.arcgis.com/datasets/rail-lines.geojson' },
  },
  {
    id: 'opportunity_zones',
    name: 'Opportunity Zones',
    category: 'Economic',
    icon: <Landmark className="size-5" />,
    layer_type: 'geojson',
    source_config: { url: 'https://services.arcgis.com/opportunity-zones.geojson' },
  },
];

const PRESET_CATEGORIES = Array.from(new Set(PRESETS.map((p) => p.category)));

// ── File parsing utilities ───────────────────────────────────────────
async function parseFile(file: File): Promise<{ geojson: GeoJSON.FeatureCollection; layerType: LayerType }> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.geojson') || name.endsWith('.json')) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    return { geojson: parsed, layerType: 'geojson' };
  }

  if (name.endsWith('.kml')) {
    const text = await file.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const geojson = kml(doc) as GeoJSON.FeatureCollection;
    return { geojson, layerType: 'kml' };
  }

  if (name.endsWith('.csv')) {
    const Papa = await import('papaparse');
    const text = await file.text();
    const result = Papa.default.parse(text, { header: true, dynamicTyping: true });
    const rows = result.data as Record<string, unknown>[];
    const features: GeoJSON.Feature[] = rows
      .filter((r) => r.latitude && r.longitude)
      .map((r) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(r.longitude ?? r.lng ?? r.lon), Number(r.latitude ?? r.lat)],
        },
        properties: r,
      }));
    return {
      geojson: { type: 'FeatureCollection', features },
      layerType: 'csv_points',
    };
  }

  if (name.endsWith('.zip')) {
    const shp = await import('shpjs');
    const buffer = await file.arrayBuffer();
    const geojson = await shp.default(buffer) as GeoJSON.FeatureCollection;
    return { geojson, layerType: 'shapefile_converted' };
  }

  if (name.endsWith('.gpx')) {
    const text = await file.text();
    const { gpx } = await import('@tmcw/togeojson');
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    const geojson = gpx(doc) as GeoJSON.FeatureCollection;
    return { geojson, layerType: 'geojson' };
  }

  throw new Error(`Unsupported file format: ${name}`);
}

// ── Component ────────────────────────────────────────────────────────
export default function AddLayerModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const activeMapId = useMapStore((s) => s.activeMapId);
  const addLayer = useMapStore((s) => s.addLayer);
  const layers = useMapStore((s) => s.layers);

  const isOpen = activeModal === 'addLayer';

  // Upload tab state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<{ name: string; featureCount: number } | null>(null);
  const [parsedData, setParsedData] = useState<{ geojson: GeoJSON.FeatureCollection; layerType: LayerType; fileName: string } | null>(null);

  // URL tab state
  const [serviceType, setServiceType] = useState<'wms' | 'wmts' | 'xyz' | 'mapbox'>('wms');
  const [serviceUrl, setServiceUrl] = useState('');
  const [wmsLayerName, setWmsLayerName] = useState('');
  const [urlTesting, setUrlTesting] = useState(false);
  const [urlTestResult, setUrlTestResult] = useState<'success' | 'error' | null>(null);

  // Draw new tab state
  const [newLayerName, setNewLayerName] = useState('');

  // Preset filter
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  const resetState = () => {
    setUploadStatus('idle');
    setUploadError(null);
    setParsedPreview(null);
    setParsedData(null);
    setServiceUrl('');
    setWmsLayerName('');
    setUrlTesting(false);
    setUrlTestResult(null);
    setNewLayerName('');
    setPresetCategory(null);
  };

  const handleClose = () => {
    resetState();
    closeModal();
  };

  // ── Upload logic ───────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setUploadStatus('parsing');
    setUploadError(null);

    try {
      const { geojson, layerType } = await parseFile(file);
      setParsedData({ geojson, layerType, fileName: file.name });
      setParsedPreview({
        name: file.name.replace(/\.[^.]+$/, ''),
        featureCount: geojson.features?.length ?? 0,
      });
      setUploadStatus('done');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse file');
      setUploadStatus('error');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.geojson', '.json'],
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'application/vnd.google-earth.kmz': ['.kmz'],
      'application/gpx+xml': ['.gpx'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
    },
    multiple: false,
  });

  const handleUploadConfirm = async () => {
    if (!parsedData || !activeMapId) return;
    setUploadStatus('uploading');

    try {
      const supabase = createClient();
      const filePath = `layers/${activeMapId}/${Date.now()}_${parsedData.fileName}`;
      const blob = new Blob([JSON.stringify(parsedData.geojson)], { type: 'application/json' });

      const { error: uploadErr } = await supabase.storage
        .from('map-data')
        .upload(filePath, blob);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('map-data')
        .getPublicUrl(filePath);

      const newLayer: MapLayer = {
        id: crypto.randomUUID(),
        map_id: activeMapId,
        name: parsedPreview?.name ?? 'Uploaded Layer',
        layer_type: parsedData.layerType,
        source_config: { url: urlData.publicUrl, geojson: parsedData.geojson },
        style_config: { color: '#F59E0B', fillOpacity: 0.3, strokeWidth: 2 },
        is_visible: true,
        opacity: 1,
        sort_order: layers.length,
        is_user_created: true,
        metadata: { featureCount: parsedData.geojson.features?.length ?? 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      addLayer(newLayer);
      handleClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('error');
    }
  };

  // ── URL/Tile service logic ─────────────────────────────────────
  const handleTestUrl = async () => {
    setUrlTesting(true);
    setUrlTestResult(null);
    try {
      await fetch(serviceUrl, { method: 'HEAD', mode: 'no-cors' });
      setUrlTestResult('success');
    } catch {
      setUrlTestResult('error');
    } finally {
      setUrlTesting(false);
    }
  };

  const handleAddServiceLayer = () => {
    if (!activeMapId || !serviceUrl) return;

    const typeMap: Record<string, LayerType> = {
      wms: 'wms',
      wmts: 'wmts',
      xyz: 'xyz_tile',
      mapbox: 'mapbox_tileset',
    };

    const newLayer: MapLayer = {
      id: crypto.randomUUID(),
      map_id: activeMapId,
      name: wmsLayerName || serviceUrl.split('/').pop() || 'Service Layer',
      layer_type: typeMap[serviceType],
      source_config: {
        url: serviceUrl,
        ...(serviceType === 'wms' && wmsLayerName ? { layers: wmsLayerName } : {}),
      },
      style_config: {},
      is_visible: true,
      opacity: 1,
      sort_order: layers.length,
      is_user_created: true,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addLayer(newLayer);
    handleClose();
  };

  // ── Preset logic ───────────────────────────────────────────────
  const handleAddPreset = (preset: PresetCard) => {
    if (!activeMapId) return;

    const newLayer: MapLayer = {
      id: crypto.randomUUID(),
      map_id: activeMapId,
      name: preset.name,
      layer_type: preset.layer_type,
      source_config: preset.source_config,
      style_config: { color: '#F59E0B' },
      is_visible: true,
      opacity: 1,
      sort_order: layers.length,
      is_user_created: true,
      metadata: { presetId: preset.id },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addLayer(newLayer);
    handleClose();
  };

  // ── Draw new logic ────────────────────────────────────────────
  const handleCreateDrawLayer = () => {
    if (!activeMapId || !newLayerName.trim()) return;

    const newLayer: MapLayer = {
      id: crypto.randomUUID(),
      map_id: activeMapId,
      name: newLayerName.trim(),
      layer_type: 'geojson',
      source_config: { geojson: { type: 'FeatureCollection', features: [] } },
      style_config: { color: '#F59E0B', fillOpacity: 0.3, strokeWidth: 2 },
      is_visible: true,
      opacity: 1,
      sort_order: layers.length,
      is_user_created: true,
      metadata: { drawable: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addLayer(newLayer);
    handleClose();
  };

  const filteredPresets = presetCategory
    ? PRESETS.filter((p) => p.category === presetCategory)
    : PRESETS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl bg-[#1F2937] border-[#374151] text-[#F9FAFB]">
        <DialogHeader>
          <DialogTitle className="text-[#F9FAFB]">Add Layer</DialogTitle>
          <DialogDescription className="text-[#9CA3AF]">
            Upload data, connect a service, choose a preset, or draw a new layer.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="mt-2">
          <TabsList className="bg-[#111827] w-full">
            <TabsTrigger value="upload" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <Upload className="size-3.5 mr-1" /> Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <Link2 className="size-3.5 mr-1" /> URL / Tile
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <LayoutGrid className="size-3.5 mr-1" /> Presets
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex-1 text-xs data-active:text-[#F59E0B]">
              <PenTool className="size-3.5 mr-1" /> Draw New
            </TabsTrigger>
          </TabsList>

          {/* ── UPLOAD TAB ──────────────────────────────────────── */}
          <TabsContent value="upload" className="mt-3 space-y-3">
            <div
              {...getRootProps()}
              className={`
                flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                  : 'border-[#374151] bg-[#111827] hover:border-[#9CA3AF]'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="size-8 text-[#9CA3AF]" />
              <p className="text-sm text-[#9CA3AF]">
                {isDragActive ? 'Drop file here...' : 'Drag & drop a file, or click to browse'}
              </p>
              <p className="text-[10px] text-[#9CA3AF]">
                .geojson, .json, .kml, .kmz, .gpx, .csv, .zip (Shapefile)
              </p>
            </div>

            {uploadStatus === 'parsing' && (
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Loader2 className="size-4 animate-spin" /> Parsing file...
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="size-4" /> {uploadError}
              </div>
            )}

            {parsedPreview && uploadStatus === 'done' && (
              <div className="rounded-md border border-[#374151] bg-[#111827] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span className="text-sm font-medium text-[#F9FAFB]">
                    {parsedPreview.name}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  {parsedPreview.featureCount} feature{parsedPreview.featureCount !== 1 ? 's' : ''} found
                </p>
                <Button
                  onClick={handleUploadConfirm}
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
                >
                  Add to Map
                </Button>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Loader2 className="size-4 animate-spin" /> Uploading to storage...
              </div>
            )}
          </TabsContent>

          {/* ── URL / TILE SERVICE TAB ──────────────────────────── */}
          <TabsContent value="url" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-[#9CA3AF]">Service Type</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['wms', 'wmts', 'xyz', 'mapbox'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setServiceType(t)}
                    className={`rounded-md border px-2 py-1.5 text-xs uppercase transition-colors ${
                      serviceType === t
                        ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                        : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF]'
                    }`}
                  >
                    {t === 'mapbox' ? 'Mapbox' : t.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#9CA3AF]">
                {serviceType === 'mapbox' ? 'Tileset ID' : 'URL'}
              </Label>
              <Input
                value={serviceUrl}
                onChange={(e) => setServiceUrl((e.target as HTMLInputElement).value)}
                placeholder={
                  serviceType === 'xyz'
                    ? 'https://tiles.example.com/{z}/{x}/{y}.png'
                    : serviceType === 'mapbox'
                    ? 'mapbox://username.tileset-id'
                    : 'https://example.com/wms'
                }
                className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm"
              />
            </div>

            {(serviceType === 'wms' || serviceType === 'wmts') && (
              <div className="space-y-1.5">
                <Label className="text-xs text-[#9CA3AF]">Layer Name</Label>
                <Input
                  value={wmsLayerName}
                  onChange={(e) => setWmsLayerName((e.target as HTMLInputElement).value)}
                  placeholder="layer_name"
                  className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestUrl}
                disabled={!serviceUrl || urlTesting}
                className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
              >
                {urlTesting ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : null}
                Test
              </Button>
              {urlTestResult === 'success' && (
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Reachable
                </span>
              )}
              {urlTestResult === 'error' && (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="size-3.5" /> Unreachable
                </span>
              )}
            </div>

            <Button
              onClick={handleAddServiceLayer}
              disabled={!serviceUrl}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
            >
              Add Service Layer
            </Button>
          </TabsContent>

          {/* ── PRESETS TAB ─────────────────────────────────────── */}
          <TabsContent value="presets" className="mt-3 space-y-3">
            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setPresetCategory(null)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors ${
                  !presetCategory
                    ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                    : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF]'
                }`}
              >
                All
              </button>
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setPresetCategory(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors ${
                    presetCategory === cat
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'border-[#374151] text-[#9CA3AF] hover:border-[#9CA3AF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <ScrollArea className="h-[240px]">
              <div className="grid grid-cols-2 gap-2">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddPreset(preset)}
                    className="flex items-center gap-2.5 rounded-lg border border-[#374151] bg-[#111827] p-3 text-left hover:border-[#F59E0B] hover:bg-[#F59E0B]/5 transition-colors"
                  >
                    <div className="text-[#9CA3AF]">{preset.icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#F9FAFB] truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">{preset.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── DRAW NEW TAB ────────────────────────────────────── */}
          <TabsContent value="draw" className="mt-3 space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="rounded-full bg-[#F59E0B]/10 p-4">
                <PenTool className="size-8 text-[#F59E0B]" />
              </div>
              <p className="text-sm text-[#9CA3AF] text-center max-w-xs">
                Create an empty layer, then use the draw tools to add shapes and annotations.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#9CA3AF]">Layer Name</Label>
              <Input
                value={newLayerName}
                onChange={(e) => setNewLayerName((e.target as HTMLInputElement).value)}
                placeholder="My new layer"
                className="bg-[#111827] border-[#374151] text-[#F9FAFB] text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateDrawLayer();
                }}
              />
            </div>

            <Button
              onClick={handleCreateDrawLayer}
              disabled={!newLayerName.trim()}
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
            >
              Create Layer
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
