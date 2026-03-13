'use client';

import { useState, useCallback } from 'react';
import {
  Layers,
  Eye,
  EyeOff,
  GripVertical,
  MoreVertical,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  Map,
  Satellite,
  Mountain,
  Sun,
  Moon,
  Globe,
  AlertTriangle,
  Droplets,
  Skull,
  Trash2,
  Copy,
  Download,
  Pencil,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMapStore } from '@/store/mapStore';
import { useUIStore } from '@/store/uiStore';
import type { BasemapStyle, MapLayer, SystemLayerConfig } from '@/types';

// ── Basemap definitions ──────────────────────────────────────────────
const BASEMAPS: { id: BasemapStyle; label: string; icon: React.ReactNode }[] = [
  { id: 'satellite-streets-v12', label: 'Satellite Streets', icon: <Satellite className="size-4" /> },
  { id: 'satellite-v9', label: 'Satellite', icon: <Globe className="size-4" /> },
  { id: 'streets-v12', label: 'Streets', icon: <Map className="size-4" /> },
  { id: 'outdoors-v12', label: 'Outdoors', icon: <Mountain className="size-4" /> },
  { id: 'dark-v11', label: 'Dark', icon: <Moon className="size-4" /> },
  { id: 'light-v11', label: 'Light', icon: <Sun className="size-4" /> },
];

// ── System layer definitions ─────────────────────────────────────────
const SYSTEM_LAYERS: SystemLayerConfig[] = [
  {
    id: 'parcels',
    name: 'Parcels',
    layer_type: 'mapbox_tileset',
    url: 'mapbox://mapbox.boundaries-par-v4',
    category: 'reference',
  },
  {
    id: 'zoning',
    name: 'Zoning',
    layer_type: 'wms',
    url: 'https://gis.data.gov/zoning/wms',
    category: 'reference',
  },
  {
    id: 'transportation',
    name: 'Transportation',
    layer_type: 'mapbox_style_layer',
    url: 'mapbox://mapbox.mapbox-terrain-v2',
    category: 'infrastructure',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    layer_type: 'wms',
    url: 'https://gis.data.gov/utilities/wms',
    category: 'infrastructure',
  },
];

// ── Constraint layer definitions ─────────────────────────────────────
const CONSTRAINT_LAYERS: SystemLayerConfig[] = [
  {
    id: 'fema_flood',
    name: 'FEMA Flood Zones',
    layer_type: 'wms',
    url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/export',
    category: 'constraint',
    risk_color: '#3B82F6',
  },
  {
    id: 'wetlands',
    name: 'Wetlands (NWI)',
    layer_type: 'wms',
    url: 'https://www.fws.gov/wetlands/arcgis/services/Wetlands/MapServer/WMSServer',
    category: 'environmental',
    risk_color: '#10B981',
  },
  {
    id: 'epa_superfund',
    name: 'EPA Superfund Sites',
    layer_type: 'geojson',
    url: 'https://data.epa.gov/efservice/SEMS_ACTIVE_SITES/geojson',
    category: 'environmental',
    risk_color: '#EF4444',
  },
  {
    id: 'epa_brownfields',
    name: 'EPA Brownfields',
    layer_type: 'geojson',
    url: 'https://data.epa.gov/efservice/ACRES_PROPERTIES/geojson',
    category: 'environmental',
    risk_color: '#F97316',
  },
  {
    id: 'endangered_species',
    name: 'Endangered Species Habitat',
    layer_type: 'wms',
    url: 'https://services.arcgis.com/QVENGdaPbd4LUkLV/arcgis/rest/services/USFWS_Critical_Habitat/FeatureServer/0',
    category: 'environmental',
    risk_color: '#A855F7',
  },
  {
    id: 'seismic_hazard',
    name: 'Seismic Hazard Zones',
    layer_type: 'wms',
    url: 'https://earthquake.usgs.gov/arcgis/rest/services/haz/HazardMaps/MapServer',
    category: 'constraint',
    risk_color: '#F59E0B',
  },
];

function getConstraintIcon(id: string) {
  switch (id) {
    case 'fema_flood':
    case 'wetlands':
      return <Droplets className="size-3.5" />;
    case 'epa_superfund':
    case 'epa_brownfields':
      return <Skull className="size-3.5" />;
    default:
      return <AlertTriangle className="size-3.5" />;
  }
}

// ── Sortable user layer row ──────────────────────────────────────────
function SortableLayerRow({ layer }: { layer: MapLayer }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: layer.id });
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);

  const toggleLayerVisibility = useMapStore((s) => s.toggleLayerVisibility);
  const updateLayer = useMapStore((s) => s.updateLayer);
  const removeLayer = useMapStore((s) => s.removeLayer);
  const setOpacity = useMapStore((s) => s.setOpacity);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleNameSave = () => {
    updateLayer(layer.id, { name: editName });
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex flex-col rounded-md border border-[#374151] bg-[#111827] transition-colors',
        isDragging && 'z-50 shadow-lg opacity-80'
      )}
    >
      <div className="flex items-center gap-1 px-1.5 py-1.5">
        {/* Drag handle */}
        <button
          className="cursor-grab touch-none text-[#9CA3AF] hover:text-[#F9FAFB]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        {/* Visibility toggle */}
        <button
          onClick={() => toggleLayerVisibility(layer.id)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          {layer.is_visible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0 mx-1">
          {editing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName((e.target as HTMLInputElement).value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') {
                  setEditName(layer.name);
                  setEditing(false);
                }
              }}
              className="h-5 text-xs bg-[#0A0E1A] border-[#374151] text-[#F9FAFB] px-1"
              autoFocus
            />
          ) : (
            <span
              className="text-xs text-[#F9FAFB] truncate block cursor-pointer"
              onDoubleClick={() => setEditing(true)}
            >
              {layer.name}
            </span>
          )}
        </div>

        {/* Color swatch */}
        <div
          className="size-3 rounded-sm border border-[#374151] shrink-0"
          style={{
            backgroundColor:
              (layer.style_config?.color as string) || '#F59E0B',
          }}
        />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          {expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>

        {/* Kebab menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-[#9CA3AF] hover:text-[#F9FAFB] opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="bg-[#1F2937] border-[#374151] text-[#F9FAFB]"
            align="end"
          >
            <DropdownMenuItem onClick={() => setEditing(true)}>
              <Pencil className="size-3.5 mr-1.5" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="size-3.5 mr-1.5" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="size-3.5 mr-1.5" /> Export
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#374151]" />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => removeLayer(layer.id)}
            >
              <Trash2 className="size-3.5 mr-1.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expanded: opacity slider */}
      {expanded && (
        <div className="px-3 pb-2 pt-0.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">
              Opacity
            </span>
            <span className="text-[10px] text-[#9CA3AF]">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
          <Slider
            value={[layer.opacity * 100]}
            min={0}
            max={100}
            onValueChange={(val) => setOpacity(layer.id, (Array.isArray(val) ? val[0] : val) / 100)}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}

// ── System layer row ─────────────────────────────────────────────────
function SystemLayerRow({
  config,
  enabled,
  opacity,
  onToggle,
  onOpacityChange,
}: {
  config: SystemLayerConfig;
  enabled: boolean;
  opacity: number;
  onToggle: () => void;
  onOpacityChange: (v: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 py-1">
        <Switch checked={enabled} onCheckedChange={onToggle} size="sm" />
        <span className="flex-1 text-xs text-[#F9FAFB]">{config.name}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          {expanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="pl-8 pr-2 pb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-[#9CA3AF]">Opacity</span>
            <span className="text-[10px] text-[#9CA3AF]">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <Slider
            value={[opacity * 100]}
            min={0}
            max={100}
            onValueChange={(val) => onOpacityChange((Array.isArray(val) ? val[0] : val) / 100)}
          />
        </div>
      )}
    </div>
  );
}

// ── Constraint layer row ─────────────────────────────────────────────
function ConstraintLayerRow({
  config,
  enabled,
  onToggle,
}: {
  config: SystemLayerConfig;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Switch checked={enabled} onCheckedChange={onToggle} size="sm" />
      <span
        className="size-2.5 rounded-full shrink-0"
        style={{ backgroundColor: config.risk_color || '#9CA3AF' }}
      />
      {getConstraintIcon(config.id)}
      <span className="flex-1 text-xs text-[#F9FAFB]">{config.name}</span>
    </div>
  );
}

// ── Section header ───────────────────────────────────────────────────
function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 py-2 text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors w-full"
    >
      {open ? (
        <ChevronDown className="size-3" />
      ) : (
        <ChevronRight className="size-3" />
      )}
      {label}
    </button>
  );
}

// ── Main LayerPanel component ────────────────────────────────────────
export default function LayerPanel() {
  const layerPanelOpen = useUIStore((s) => s.layerPanelOpen);
  const setLayerPanelOpen = useUIStore((s) => s.setLayerPanelOpen);
  const openModal = useUIStore((s) => s.openModal);

  const basemap = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);
  const layers = useMapStore((s) => s.layers);
  const reorderLayers = useMapStore((s) => s.reorderLayers);

  const userLayers = layers.filter((l) => l.is_user_created);

  const [basemapsOpen, setBasemapsOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);
  const [constraintOpen, setConstraintOpen] = useState(true);
  const [userOpen, setUserOpen] = useState(true);

  // System layer toggle state (local since these aren't in the store by default)
  const [systemEnabled, setSystemEnabled] = useState<Record<string, boolean>>({});
  const [systemOpacity, setSystemOpacity] = useState<Record<string, number>>({});
  const [constraintEnabled, setConstraintEnabled] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const newIndex = userLayers.findIndex((l) => l.id === over.id);
      if (newIndex !== -1) {
        reorderLayers(active.id as string, newIndex);
      }
    },
    [userLayers, reorderLayers]
  );

  return (
    <div
      className={cn(
        'fixed top-0 left-0 z-40 h-full w-80 bg-[#0A0E1A] border-r border-[#374151] shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
        layerPanelOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#374151]">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-[#F59E0B]" />
          <h2 className="text-sm font-semibold text-[#F9FAFB]">Layers</h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setLayerPanelOpen(false)}
          className="text-[#9CA3AF] hover:text-[#F9FAFB]"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1">
          {/* ── BASEMAPS ────────────────────────────────────────── */}
          <SectionHeader
            label="Basemaps"
            open={basemapsOpen}
            onToggle={() => setBasemapsOpen(!basemapsOpen)}
          />
          {basemapsOpen && (
            <div className="grid grid-cols-3 gap-1.5 pb-2">
              {BASEMAPS.map((bm) => (
                <button
                  key={bm.id}
                  onClick={() => setBasemap(bm.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border p-2 text-[10px] transition-colors',
                    basemap === bm.id
                      ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'border-[#374151] bg-[#111827] text-[#9CA3AF] hover:border-[#9CA3AF]'
                  )}
                >
                  {bm.icon}
                  <span className="truncate w-full text-center">{bm.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="h-px bg-[#374151]" />

          {/* ── SYSTEM LAYERS ───────────────────────────────────── */}
          <SectionHeader
            label="System Layers"
            open={systemOpen}
            onToggle={() => setSystemOpen(!systemOpen)}
          />
          {systemOpen && (
            <div className="space-y-0.5 pb-2">
              {SYSTEM_LAYERS.map((sl) => (
                <SystemLayerRow
                  key={sl.id}
                  config={sl}
                  enabled={systemEnabled[sl.id] ?? false}
                  opacity={systemOpacity[sl.id] ?? 1}
                  onToggle={() =>
                    setSystemEnabled((p) => ({ ...p, [sl.id]: !p[sl.id] }))
                  }
                  onOpacityChange={(v) =>
                    setSystemOpacity((p) => ({ ...p, [sl.id]: v }))
                  }
                />
              ))}
            </div>
          )}

          <div className="h-px bg-[#374151]" />

          {/* ── CONSTRAINT LAYERS ───────────────────────────────── */}
          <SectionHeader
            label="Constraint Layers"
            open={constraintOpen}
            onToggle={() => setConstraintOpen(!constraintOpen)}
          />
          {constraintOpen && (
            <div className="space-y-0.5 pb-2">
              {CONSTRAINT_LAYERS.map((cl) => (
                <ConstraintLayerRow
                  key={cl.id}
                  config={cl}
                  enabled={constraintEnabled[cl.id] ?? false}
                  onToggle={() =>
                    setConstraintEnabled((p) => ({ ...p, [cl.id]: !p[cl.id] }))
                  }
                />
              ))}
            </div>
          )}

          <div className="h-px bg-[#374151]" />

          {/* ── USER LAYERS ─────────────────────────────────────── */}
          <SectionHeader
            label="User Layers"
            open={userOpen}
            onToggle={() => setUserOpen(!userOpen)}
          />
          {userOpen && (
            <div className="space-y-1 pb-2">
              {userLayers.length === 0 ? (
                <p className="text-[11px] text-[#9CA3AF] italic py-2 text-center">
                  No user layers yet
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={userLayers.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {userLayers.map((layer) => (
                      <SortableLayerRow key={layer.id} layer={layer} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Add layer button */}
      <div className="px-3 py-3 border-t border-[#374151]">
        <Button
          onClick={() => openModal('addLayer')}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0E1A] font-semibold"
        >
          <Plus className="size-4 mr-1.5" />
          Add Layer
        </Button>
      </div>
    </div>
  );
}
