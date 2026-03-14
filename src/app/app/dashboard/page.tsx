'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Map,
  Bookmark,
  HardDrive,
  Plus,
  Upload,
  Download,
  Clock,
  FileText,
  Trash2,
  Share2,
  Edit,
  Eye,
  User,
  File,
  Bell,
  BellOff,
  Building2,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings,
  MoreVertical,
  ExternalLink,
  Pencil,
  BarChart3,
  X,
} from 'lucide-react';
import type { MapRecord, Parcel, LayerType } from '@/types';

/* ── Inline types for layers ─────────────────────────────────────────── */

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

/* ── Dashboard types ─────────────────────────────────────────────────── */

interface DashboardStats {
  totalMaps: number;
  totalLayers: number;
  totalParcels: number;
  storageUsed: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string | null; email: string } | null;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

const PARCEL_PAGE_SIZE = 25;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

function getActionIcon(action: string) {
  switch (action) {
    case 'create':
      return <Plus className="h-4 w-4 text-green-400" />;
    case 'update':
    case 'edit':
      return <Edit className="h-4 w-4 text-blue-400" />;
    case 'delete':
      return <Trash2 className="h-4 w-4 text-red-400" />;
    case 'share':
      return <Share2 className="h-4 w-4 text-purple-400" />;
    case 'view':
      return <Eye className="h-4 w-4 text-[#9CA3AF]" />;
    case 'export':
      return <Download className="h-4 w-4 text-[#F59E0B]" />;
    default:
      return <FileText className="h-4 w-4 text-[#9CA3AF]" />;
  }
}

function getShareBadge(mode: string) {
  switch (mode) {
    case 'public':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Public</Badge>;
    case 'unlisted':
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">Unlisted</Badge>;
    default:
      return <Badge className="bg-[#374151] text-[#9CA3AF] border-[#374151] text-[10px]">Private</Badge>;
  }
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  /* ── Active tab ──────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('overview');

  /* ── Overview state ──────────────────────────────────────────────── */
  const [stats, setStats] = useState<DashboardStats>({
    totalMaps: 0,
    totalLayers: 0,
    totalParcels: 0,
    storageUsed: '0 MB',
  });
  const [recentMaps, setRecentMaps] = useState<MapRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const placeholderFiles = [
    { name: 'downtown_parcels.geojson', size: '2.4 MB', date: '2 hours ago' },
    { name: 'zoning_overlay.kml', size: '1.1 MB', date: '1 day ago' },
    { name: 'site_boundaries.shp', size: '4.7 MB', date: '3 days ago' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  /* ── Parcels state ───────────────────────────────────────────────── */
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [parcelSearch, setParcelSearch] = useState('');
  const [parcelPage, setParcelPage] = useState(0);
  const [parcelTotalCount, setParcelTotalCount] = useState(0);

  /* ── Layers state ────────────────────────────────────────────────── */
  const [layers, setLayers] = useState<LayerRecord[]>([]);
  const [layersLoading, setLayersLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [selectedLayer, setSelectedLayer] = useState<LayerRecord | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');

  /* ── Dashboard data fetch ────────────────────────────────────────── */
  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const { data: maps, count: mapsCount } = await supabase
          .from('maps')
          .select('*', { count: 'exact' })
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })
          .limit(8);

        const { count: layersCount } = await supabase
          .from('map_layers')
          .select('*', { count: 'exact', head: true });

        const { count: parcelsCount } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true });

        const { data: auditData } = await supabase
          .from('audit_log')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false })
          .limit(20);

        setStats({
          totalMaps: mapsCount || 0,
          totalLayers: layersCount || 0,
          totalParcels: parcelsCount || 0,
          storageUsed: `${((mapsCount || 0) * 2.3).toFixed(1)} MB`,
        });

        setRecentMaps((maps as MapRecord[]) || []);
        setAuditLog((auditData as AuditLogEntry[]) || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase]);

  /* ── Parcels fetch ───────────────────────────────────────────────── */
  const loadParcels = useCallback(async () => {
    setParcelsLoading(true);

    let query = supabase
      .from('parcels')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(parcelPage * PARCEL_PAGE_SIZE, (parcelPage + 1) * PARCEL_PAGE_SIZE - 1);

    if (parcelSearch.trim()) {
      query = query.or(
        `situs_address.ilike.%${parcelSearch.trim()}%,apn.ilike.%${parcelSearch.trim()}%`
      );
    }

    const { data, count } = await query;
    if (data) setParcels(data);
    if (count !== null) setParcelTotalCount(count);
    setParcelsLoading(false);
  }, [parcelPage, parcelSearch, supabase]);

  useEffect(() => {
    if (activeTab === 'parcels') {
      loadParcels();
    }
  }, [activeTab, loadParcels]);

  useEffect(() => {
    setParcelPage(0);
  }, [parcelSearch]);

  const parcelTotalPages = Math.ceil(parcelTotalCount / PARCEL_PAGE_SIZE);

  /* ── Layers fetch ────────────────────────────────────────────────── */
  useEffect(() => {
    if (activeTab !== 'layers') return;

    async function fetchLayers() {
      setLayersLoading(true);
      const { data, error } = await supabase
        .from('map_layers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
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
      setLayersLoading(false);
    }
    fetchLayers();
  }, [activeTab, supabase]);

  /* ── Layer helpers ───────────────────────────────────────────────── */
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
      setSelectedLayer((prev) =>
        prev ? { ...prev, name: editName, category: editCategory } : prev
      );
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

  /* ── Stat cards ──────────────────────────────────────────────────── */
  const statCards = [
    { label: 'Total Maps', value: stats.totalMaps, icon: Map, color: 'text-blue-400' },
    { label: 'Total Layers', value: stats.totalLayers, icon: Layers, color: 'text-purple-400' },
    { label: 'Saved Parcels', value: stats.totalParcels, icon: Bookmark, color: 'text-green-400' },
    { label: 'Storage Used', value: stats.storageUsed, icon: HardDrive, color: 'text-[#F59E0B]' },
  ];

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#F9FAFB]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">{formatDate(new Date())}</p>
      </div>

      {/* Tabbed Layout */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="mb-6 w-full justify-start gap-0 border-b border-[#374151]">
          <TabsTrigger
            value="overview"
            className="rounded-none px-4 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] data-active:text-[#F9FAFB] after:bg-[#F59E0B]"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="parcels"
            className="rounded-none px-4 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] data-active:text-[#F9FAFB] after:bg-[#F59E0B]"
          >
            Parcels
          </TabsTrigger>
          <TabsTrigger
            value="layers"
            className="rounded-none px-4 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] data-active:text-[#F9FAFB] after:bg-[#F59E0B]"
          >
            Layer Library
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none px-4 py-2.5 text-sm text-[#9CA3AF] hover:text-[#F9FAFB] data-active:text-[#F9FAFB] after:bg-[#F59E0B]"
          >
            Activity
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────── OVERVIEW TAB ────────────────────── */}
        <TabsContent value="overview">
          {/* Quick Stats */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-[#374151] bg-[#1F2937]">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg bg-[#111827] p-3 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-[#9CA3AF]">{stat.label}</p>
                    <p className="text-2xl font-semibold text-[#F9FAFB]">
                      {loading ? '...' : stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Maps */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Recent Maps</h2>
              <Link href="/app/maps">
                <Button variant="ghost" className="text-[#9CA3AF] hover:text-[#F9FAFB]">
                  View all
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-[#374151] bg-[#1F2937] animate-pulse">
                      <div className="h-32 rounded-t-xl bg-[#111827]" />
                      <CardContent>
                        <div className="h-4 w-3/4 rounded bg-[#374151] mb-2" />
                        <div className="h-3 w-1/2 rounded bg-[#374151]" />
                      </CardContent>
                    </Card>
                  ))
                : recentMaps.map((map) => (
                    <Link key={map.id} href={`/app/maps/${map.id}`}>
                      <Card className="group border-[#374151] bg-[#1F2937] transition-all hover:border-[#F59E0B]/40 hover:bg-[#1F2937]/80 cursor-pointer">
                        <div className="relative h-32 rounded-t-xl bg-[#111827] flex items-center justify-center overflow-hidden">
                          <Map className="h-10 w-10 text-[#374151] group-hover:text-[#F59E0B]/30 transition-colors" />
                          <div className="absolute top-2 right-2">
                            {getShareBadge(map.share_mode)}
                          </div>
                        </div>
                        <CardContent className="pt-0">
                          <h3 className="font-medium text-[#F9FAFB] truncate">{map.title}</h3>
                          {map.description && (
                            <p className="mt-1 text-xs text-[#9CA3AF] line-clamp-2">
                              {map.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-1 text-xs text-[#9CA3AF]">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(map.updated_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              {!loading && recentMaps.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <Map className="mb-3 h-10 w-10 text-[#374151]" />
                  <p className="text-sm text-[#9CA3AF]">No maps yet. Create your first map to get started.</p>
                  <Link href="/app/maps/new" className="mt-3">
                    <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
                      <Plus className="h-4 w-4" />
                      New Map
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[#F9FAFB]">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Link href="/app/maps/new">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
                >
                  <Plus className="h-5 w-5 text-[#F59E0B]" />
                  <span className="text-xs">New Map</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
                onClick={() => setActiveTab('layers')}
              >
                <Upload className="h-5 w-5 text-blue-400" />
                <span className="text-xs">Import Layer</span>
              </Button>
              <Link href="/app/exports">
                <Button
                  variant="outline"
                  className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
                >
                  <Download className="h-5 w-5 text-green-400" />
                  <span className="text-xs">Export All</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* File Management */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#F9FAFB]">File Management</h2>
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardContent>
                <div className="mb-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#374151] bg-[#111827] px-6 py-10 text-center transition-colors hover:border-[#F59E0B]/40">
                  <Upload className="mb-3 h-8 w-8 text-[#9CA3AF]" />
                  <p className="text-sm font-medium text-[#F9FAFB]">Upload GeoJSON, KML, or Shapefile</p>
                  <p className="mt-1 text-xs text-[#9CA3AF]">Drag and drop files here, or click to browse</p>
                  <Button className="mt-4 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
                    <Upload className="h-4 w-4" />
                    Choose Files
                  </Button>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-medium text-[#9CA3AF]">Recently Uploaded</h3>
                  <div className="divide-y divide-[#374151]">
                    {placeholderFiles.map((file) => (
                      <div key={file.name} className="flex items-center gap-3 py-3">
                        <div className="rounded-lg bg-[#111827] p-2">
                          <File className="h-4 w-4 text-[#F59E0B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#F9FAFB] truncate">{file.name}</p>
                          <p className="text-xs text-[#9CA3AF]">{file.size}</p>
                        </div>
                        <span className="shrink-0 text-xs text-[#9CA3AF]">{file.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ────────────────────── PARCELS TAB ─────────────────────── */}
        <TabsContent value="parcels">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-[#F59E0B]" />
              <h2 className="text-xl font-bold text-[#F9FAFB]">Parcels</h2>
              <span className="rounded-full bg-[#1F2937] px-2.5 py-0.5 text-xs text-[#9CA3AF]">
                {parcelTotalCount}
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search by address or APN..."
              value={parcelSearch}
              onChange={(e) => setParcelSearch(e.target.value)}
              className="h-9 border-[#374151] bg-[#111827] pl-10 text-[#F9FAFB] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-[#374151] bg-[#111827]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#374151]">
                  {['Address', 'APN', 'County', 'State', 'Acreage', 'Zoning', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {parcelsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#F59E0B]" />
                    </td>
                  </tr>
                ) : parcels.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm text-[#9CA3AF]"
                    >
                      {parcelSearch ? 'No parcels match your search.' : 'No parcels found.'}
                    </td>
                  </tr>
                ) : (
                  parcels.map((parcel) => (
                    <tr
                      key={parcel.id}
                      className="cursor-pointer border-b border-[#374151]/50 transition-colors hover:bg-[#1F2937]"
                      onClick={() => router.push(`/app/parcels/${parcel.id}`)}
                    >
                      <td className="px-4 py-3 text-[#F9FAFB]">
                        {parcel.situs_address || '--'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF]">
                        {parcel.apn || '--'}
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF]">{parcel.county || '--'}</td>
                      <td className="px-4 py-3 text-[#9CA3AF]">
                        {parcel.state_abbr || '--'}
                      </td>
                      <td className="px-4 py-3 text-[#9CA3AF]">
                        {parcel.acreage ? `${parcel.acreage.toFixed(2)} ac` : '--'}
                      </td>
                      <td className="px-4 py-3">
                        {parcel.zoning ? (
                          <span className="rounded bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
                            {parcel.zoning}
                          </span>
                        ) : (
                          <span className="text-[#9CA3AF]">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="xs"
                          variant="ghost"
                          className="gap-1 text-[#9CA3AF] hover:text-[#F59E0B]"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/app/parcels/${parcel.id}`);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {parcelTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">
                Showing {parcelPage * PARCEL_PAGE_SIZE + 1}-
                {Math.min((parcelPage + 1) * PARCEL_PAGE_SIZE, parcelTotalCount)} of {parcelTotalCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={parcelPage === 0}
                  onClick={() => setParcelPage((p) => p - 1)}
                  className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={parcelPage >= parcelTotalPages - 1}
                  onClick={() => setParcelPage((p) => p + 1)}
                  className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ────────────────────── LAYERS TAB ──────────────────────── */}
        <TabsContent value="layers">
          <div className="flex gap-0">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-[#F9FAFB]">Layer Library</h2>
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
              {layersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
                </div>
              ) : filteredLayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Layers className="mb-3 h-12 w-12 text-[#374151]" />
                  <p className="text-[#9CA3AF]">No layers found in this category.</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${detailPanelOpen ? 'lg:grid-cols-2' : 'lg:grid-cols-3 xl:grid-cols-4'}`}>
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

            {/* Detail Panel */}
            {detailPanelOpen && selectedLayer && (
              <div className="w-80 lg:w-96 shrink-0 border-l border-[#374151] bg-[#1F2937] overflow-y-auto rounded-r-xl max-h-[calc(100vh-220px)]">
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
        </TabsContent>

        {/* ────────────────────── ACTIVITY TAB ────────────────────── */}
        <TabsContent value="activity">
          {/* Your Profile */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-[#F9FAFB]">Your Profile</h2>
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F59E0B]/20 text-[#F59E0B]">
                      {profile?.full_name ? (
                        <span className="text-lg font-semibold">
                          {profile.full_name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#F9FAFB]">
                        {profile?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{profile?.email || 'No email'}</p>
                      <Badge className="mt-1 bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30 text-[10px]">
                        {profile?.role || 'Member'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className="flex items-center gap-2 rounded-lg border border-[#374151] bg-[#111827] px-3 py-2 text-xs text-[#9CA3AF] transition-colors hover:border-[#F59E0B]/40 hover:text-[#F9FAFB]"
                    >
                      {notificationsEnabled ? (
                        <Bell className="h-4 w-4 text-[#F59E0B]" />
                      ) : (
                        <BellOff className="h-4 w-4 text-[#9CA3AF]" />
                      )}
                      {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                    </button>
                    <Link href="/app/settings">
                      <Button variant="outline" className="border-[#374151] bg-[#111827] text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]">
                        <Edit className="h-4 w-4" />
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#F9FAFB]">Recent Activity</h2>
            <Card className="border-[#374151] bg-[#1F2937]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 border-b border-[#374151] px-4 py-3 last:border-0 animate-pulse">
                        <div className="h-8 w-8 rounded-full bg-[#374151]" />
                        <div className="flex-1">
                          <div className="h-3 w-3/4 rounded bg-[#374151] mb-1" />
                          <div className="h-2 w-1/4 rounded bg-[#374151]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : auditLog.length > 0 ? (
                  <div className="divide-y divide-[#374151]">
                    {auditLog.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="mt-0.5 rounded-full bg-[#111827] p-2">
                          {getActionIcon(entry.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#F9FAFB]">
                            <span className="font-medium">
                              {entry.profiles?.full_name || entry.profiles?.email || 'Unknown user'}
                            </span>{' '}
                            <span className="text-[#9CA3AF]">
                              {entry.action}d a {entry.resource_type}
                            </span>
                          </p>
                          {entry.metadata && (
                            <p className="mt-0.5 text-xs text-[#9CA3AF] truncate">
                              {typeof entry.metadata === 'object'
                                ? (entry.metadata as Record<string, unknown>).title as string ||
                                  (entry.metadata as Record<string, unknown>).name as string ||
                                  ''
                                : ''}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-[#9CA3AF]">
                          {formatRelativeTime(entry.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Clock className="mb-2 h-8 w-8 text-[#374151]" />
                    <p className="text-sm text-[#9CA3AF]">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
