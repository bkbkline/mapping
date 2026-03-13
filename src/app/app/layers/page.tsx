'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Plus,
  Settings,
  MoreVertical,
  ExternalLink,
  Pencil,
  Trash2,
  Clock,
  Map,
  X,
  Loader2,
  BarChart3,
} from 'lucide-react';
import type { LayerType } from '@/types';

interface LayerRecord {
  id: string;
  name: string;
  layer_type: LayerType;
  category: string;
  source_config: Record<string, unknown>;
  style_config: Record<string, unknown>;
  is_user_created: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  last_used?: string;
  usage_count?: number;
}

type Category = 'all' | 'zoning' | 'utilities' | 'infrastructure' | 'environmental' | 'transportation' | 'industrial' | 'custom';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'zoning', label: 'Zoning' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'custom', label: 'Custom' },
];

const LAYER_TYPE_COLORS: Record<string, string> = {
  geojson: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  wms: 'bg-green-500/20 text-green-400 border-green-500/30',
  wmts: 'bg-green-500/20 text-green-400 border-green-500/30',
  xyz_tile: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  mapbox_tileset: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
  mapbox_style_layer: 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30',
  csv_points: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  kml: 'bg-red-500/20 text-red-400 border-red-500/30',
  shapefile_converted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return 'Today';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function LayersPage() {
  useAuth();
  const supabase = createClient();

  const [layers, setLayers] = useState<LayerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [selectedLayer, setSelectedLayer] = useState<LayerRecord | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Detail panel editing state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    async function fetchLayers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('map_layers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        // Deduplicate by name for the library view
        const seen = new Set<string>();
        const unique: LayerRecord[] = [];
        for (const layer of data) {
          if (!seen.has(layer.name)) {
            seen.add(layer.name);
            unique.push({
              ...layer,
              category: (layer.metadata as Record<string, unknown>)?.category as string || 'custom',
              last_used: layer.updated_at,
              usage_count: 1,
            } as LayerRecord);
          } else {
            const existing = unique.find((l) => l.name === layer.name);
            if (existing) {
              existing.usage_count = (existing.usage_count || 0) + 1;
            }
          }
        }
        setLayers(unique);
      }
      setLoading(false);
    }
    fetchLayers();
  }, [supabase]);

  function openDetail(layer: LayerRecord) {
    setSelectedLayer(layer);
    setEditName(layer.name);
    setEditCategory(layer.category);
    setDetailPanelOpen(true);
  }

  async function saveLayerDetails() {
    if (!selectedLayer) return;
    const { error } = await supabase
      .from('map_layers')
      .update({
        name: editName,
        metadata: { ...(selectedLayer.metadata || {}), category: editCategory },
      })
      .eq('id', selectedLayer.id);

    if (!error) {
      setLayers((prev) =>
        prev.map((l) =>
          l.id === selectedLayer.id
            ? { ...l, name: editName, category: editCategory }
            : l
        )
      );
      setSelectedLayer((prev) => prev ? { ...prev, name: editName, category: editCategory } : prev);
    }
  }

  async function deleteLayer(id: string) {
    const { error } = await supabase.from('map_layers').delete().eq('id', id);
    if (!error) {
      setLayers((prev) => prev.filter((l) => l.id !== id));
      if (selectedLayer?.id === id) {
        setDetailPanelOpen(false);
        setSelectedLayer(null);
      }
    }
  }

  const filteredLayers =
    activeCategory === 'all'
      ? layers
      : layers.filter((l) => l.category === activeCategory);

  return (
    <div className="min-h-full bg-[#0A0E1A]">
      <div className="flex">
        {/* Main content */}
        <div className={`flex-1 p-6 transition-all ${detailPanelOpen ? 'mr-96' : ''}`}>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#F9FAFB]">Layer Library</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]">
                <Settings className="h-4 w-4" />
                Create Preset
              </Button>
              <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
                <Plus className="h-4 w-4" />
                Add Layer
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-1 rounded-lg border border-[#374151] bg-[#111827] p-0.5 w-fit">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeCategory === cat.value
                      ? 'bg-[#1F2937] text-[#F9FAFB]'
                      : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
            </div>
          ) : filteredLayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Layers className="mb-3 h-12 w-12 text-[#374151]" />
              <p className="text-[#9CA3AF]">No layers found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLayers.map((layer) => (
                <Card
                  key={layer.id}
                  className="group border-[#374151] bg-[#1F2937] transition-all hover:border-[#F59E0B]/40 cursor-pointer"
                  onClick={() => openDetail(layer)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-[#F9FAFB] truncate">{layer.name}</h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Badge
                            className={`${LAYER_TYPE_COLORS[layer.layer_type] || 'bg-[#374151] text-[#9CA3AF]'} text-[10px]`}
                          >
                            {layer.layer_type.replace(/_/g, ' ')}
                          </Badge>
                          <Badge className="bg-[#111827] text-[#9CA3AF] border-[#374151] text-[10px] capitalize">
                            {layer.category}
                          </Badge>
                        </div>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <button className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#374151]">
                            <DropdownMenuItem
                              className="text-[#F9FAFB] focus:bg-[#374151]"
                              onClick={() => openDetail(layer)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[#F9FAFB] focus:bg-[#374151]"
                              onClick={() => openDetail(layer)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#374151]" />
                            <DropdownMenuItem
                              variant="destructive"
                              className="focus:bg-red-500/10"
                              onClick={() => deleteLayer(layer.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#9CA3AF]">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(layer.last_used || layer.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        <span>{layer.usage_count || 0} uses</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel (slide-out) */}
        {detailPanelOpen && selectedLayer && (
          <div className="fixed right-0 top-0 z-40 h-screen w-96 border-l border-[#374151] bg-[#1F2937] shadow-xl overflow-y-auto">
            <div className="p-6">
              {/* Panel header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#F9FAFB]">Layer Details</h2>
                <button
                  onClick={() => setDetailPanelOpen(false)}
                  className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Preview map placeholder */}
              <div className="mb-6 h-48 rounded-lg bg-[#111827] border border-[#374151] flex items-center justify-center">
                <div className="text-center">
                  <Map className="mx-auto h-8 w-8 text-[#374151]" />
                  <p className="mt-1 text-xs text-[#9CA3AF]">Layer Preview</p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-[#9CA3AF] text-xs">Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 border-[#374151] bg-[#111827] text-[#F9FAFB]"
                  />
                </div>

                <div>
                  <Label className="text-[#9CA3AF] text-xs">Category</Label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-sm text-[#F9FAFB]"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-[#9CA3AF] text-xs">Layer Type</Label>
                  <div className="mt-1">
                    <Badge
                      className={`${LAYER_TYPE_COLORS[selectedLayer.layer_type] || 'bg-[#374151] text-[#9CA3AF]'} text-xs`}
                    >
                      {selectedLayer.layer_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Source config */}
                <div>
                  <Label className="text-[#9CA3AF] text-xs">Source Configuration</Label>
                  <div className="mt-1 rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <pre className="text-xs text-[#9CA3AF] overflow-auto max-h-40">
                      {JSON.stringify(selectedLayer.source_config, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Style config */}
                <div>
                  <Label className="text-[#9CA3AF] text-xs">Style Configuration</Label>
                  <div className="mt-1 rounded-lg border border-[#374151] bg-[#111827] p-3">
                    <pre className="text-xs text-[#9CA3AF] overflow-auto max-h-40">
                      {JSON.stringify(selectedLayer.style_config, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90"
                    onClick={saveLayerDetails}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#374151] text-[#9CA3AF]"
                    onClick={() => setDetailPanelOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
