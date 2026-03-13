'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Map,
  Clock,
  ExternalLink,
  Copy,
  Share2,
  Archive,
  Trash2,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import type { MapRecord } from '@/types';

type FilterTab = 'all' | 'my_maps' | 'shared' | 'archived';
type SortOption = 'updated_at' | 'created_at' | 'title';
type ViewMode = 'grid' | 'list';

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

function formatRelativeTime(dateStr: string): string {
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
  return date.toLocaleDateString();
}

export default function MapsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_at');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteTarget, setDeleteTarget] = useState<MapRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchMaps() {
      setLoading(true);
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .order(sortBy, { ascending: sortBy === 'title' });

      if (!error && data) {
        setMaps(data as MapRecord[]);
      }
      setLoading(false);
    }
    fetchMaps();
  }, [supabase, sortBy]);

  const filteredMaps = useMemo(() => {
    let result = maps;

    // Tab filter
    switch (activeTab) {
      case 'my_maps':
        result = result.filter((m) => m.owner_id === user?.id && !m.is_archived);
        break;
      case 'shared':
        result = result.filter((m) => m.share_mode !== 'private' && !m.is_archived);
        break;
      case 'archived':
        result = result.filter((m) => m.is_archived);
        break;
      default:
        result = result.filter((m) => !m.is_archived);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [maps, activeTab, searchQuery, user?.id]);

  async function handleDuplicate(map: MapRecord) {
    const { data, error } = await supabase
      .from('maps')
      .insert({
        title: `${map.title} (Copy)`,
        description: map.description,
        center_lng: map.center_lng,
        center_lat: map.center_lat,
        zoom: map.zoom,
        basemap: map.basemap,
        share_mode: 'private',
        is_archived: false,
        tags: map.tags,
        owner_id: user?.id,
        org_id: map.org_id,
      })
      .select()
      .single();

    if (!error && data) {
      setMaps((prev) => [data as MapRecord, ...prev]);
    }
  }

  async function handleArchive(map: MapRecord) {
    const { error } = await supabase
      .from('maps')
      .update({ is_archived: !map.is_archived })
      .eq('id', map.id);

    if (!error) {
      setMaps((prev) =>
        prev.map((m) => (m.id === map.id ? { ...m, is_archived: !m.is_archived } : m))
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from('maps').delete().eq('id', deleteTarget.id);
    if (!error) {
      setMaps((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  const tabs: { label: string; value: FilterTab }[] = [
    { label: 'All', value: 'all' },
    { label: 'My Maps', value: 'my_maps' },
    { label: 'Shared', value: 'shared' },
    { label: 'Archived', value: 'archived' },
  ];

  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#F9FAFB]">Maps</h1>
        <Link href="/app/maps/new">
          <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
            <Plus className="h-4 w-4" />
            New Map
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Filter Tabs */}
          <div className="flex rounded-lg border border-[#374151] bg-[#111827] p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.value
                    ? 'bg-[#1F2937] text-[#F9FAFB]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search maps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-56 border-[#374151] bg-[#111827] pl-8 text-sm text-[#F9FAFB] placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="border-[#374151] bg-[#111827] text-[#9CA3AF] hover:text-[#F9FAFB]">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1F2937] border-[#374151]">
              <DropdownMenuItem
                className="text-[#F9FAFB] focus:bg-[#374151]"
                onClick={() => setSortBy('updated_at')}
              >
                Last Modified
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#F9FAFB] focus:bg-[#374151]"
                onClick={() => setSortBy('created_at')}
              >
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[#F9FAFB] focus:bg-[#374151]"
                onClick={() => setSortBy('title')}
              >
                Title
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-[#374151] bg-[#111827] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-[#1F2937] text-[#F9FAFB]' : 'text-[#9CA3AF]'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-[#1F2937] text-[#F9FAFB]' : 'text-[#9CA3AF]'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
        </div>
      ) : filteredMaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Map className="mb-3 h-12 w-12 text-[#374151]" />
          <p className="text-[#9CA3AF]">
            {searchQuery ? 'No maps match your search.' : 'No maps found.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredMaps.map((map) => (
            <Card
              key={map.id}
              className="group border-[#374151] bg-[#1F2937] transition-all hover:border-[#F59E0B]/40 cursor-pointer"
            >
              <Link href={`/app/maps/${map.id}`}>
                <div className="relative h-36 rounded-t-xl bg-[#111827] flex items-center justify-center">
                  <Map className="h-10 w-10 text-[#374151] group-hover:text-[#F59E0B]/30 transition-colors" />
                  <div className="absolute top-2 right-2">{getShareBadge(map.share_mode)}</div>
                </div>
              </Link>
              <CardContent className="relative pt-0">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <Link href={`/app/maps/${map.id}`}>
                      <h3 className="font-medium text-[#F9FAFB] truncate hover:text-[#F59E0B] transition-colors">
                        {map.title}
                      </h3>
                    </Link>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(map.updated_at)}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#374151]">
                      <DropdownMenuItem
                        className="text-[#F9FAFB] focus:bg-[#374151]"
                        onClick={() => router.push(`/app/maps/${map.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[#F9FAFB] focus:bg-[#374151]"
                        onClick={() => handleDuplicate(map)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[#F9FAFB] focus:bg-[#374151]">
                        <Share2 className="h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[#F9FAFB] focus:bg-[#374151]"
                        onClick={() => handleArchive(map)}
                      >
                        <Archive className="h-4 w-4" />
                        {map.is_archived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#374151]" />
                      <DropdownMenuItem
                        variant="destructive"
                        className="focus:bg-red-500/10"
                        onClick={() => setDeleteTarget(map)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="border-[#374151] bg-[#1F2937] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#374151] text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Title
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Last Modified
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Created By
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Share Mode
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {filteredMaps.map((map) => (
                  <tr
                    key={map.id}
                    className="hover:bg-[#111827]/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/app/maps/${map.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#111827]">
                          <Map className="h-4 w-4 text-[#9CA3AF]" />
                        </div>
                        <span className="font-medium text-[#F9FAFB] truncate max-w-xs">
                          {map.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                      {formatRelativeTime(map.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                      {profile?.full_name || profile?.email || '--'}
                    </td>
                    <td className="px-4 py-3">{getShareBadge(map.share_mode)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <button className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#374151]">
                          <DropdownMenuItem
                            className="text-[#F9FAFB] focus:bg-[#374151]"
                            onClick={() => router.push(`/app/maps/${map.id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[#F9FAFB] focus:bg-[#374151]"
                            onClick={() => handleDuplicate(map)}
                          >
                            <Copy className="h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[#F9FAFB] focus:bg-[#374151]">
                            <Share2 className="h-4 w-4" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[#F9FAFB] focus:bg-[#374151]"
                            onClick={() => handleArchive(map)}
                          >
                            <Archive className="h-4 w-4" />
                            {map.is_archived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#374151]" />
                          <DropdownMenuItem
                            variant="destructive"
                            className="focus:bg-red-500/10"
                            onClick={() => setDeleteTarget(map)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="bg-[#1F2937] border-[#374151] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F9FAFB]">Delete Map</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-[#374151] bg-[#111827]">
            <DialogClose>
              <Button variant="outline" className="border-[#374151] text-[#9CA3AF]">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
