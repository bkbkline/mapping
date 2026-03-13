'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  FolderOpen,
  MoreVertical,
  ExternalLink,
  Share2,
  Copy,
  Trash2,
  Clock,
  Loader2,
  Tag,
} from 'lucide-react';
import type { ShareMode, ParcelStatus } from '@/types';

interface Collection {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  share_mode: ShareMode;
  tags: string[];
  created_at: string;
  updated_at: string;
  parcel_count?: number;
  status_counts?: Record<ParcelStatus, number>;
}

const STATUS_COLORS: Record<ParcelStatus, string> = {
  prospect: '#6B7280',
  active: '#3B82F6',
  under_contract: '#F59E0B',
  closed: '#10B981',
  rejected: '#EF4444',
  on_hold: '#8B5CF6',
};

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

function StatusBar({ statusCounts, total }: { statusCounts?: Record<string, number>; total: number }) {
  if (!statusCounts || total === 0) return null;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#111827]">
      {Object.entries(statusCounts).map(([status, count]) => {
        if (count === 0) return null;
        const width = (count / total) * 100;
        return (
          <div
            key={status}
            className="h-full transition-all"
            style={{
              width: `${width}%`,
              backgroundColor: STATUS_COLORS[status as ParcelStatus] || '#6B7280',
            }}
          />
        );
      })}
    </div>
  );
}

export default function CollectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // New collection form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newShareMode, setNewShareMode] = useState<ShareMode>('private');

  useEffect(() => {
    async function fetchCollections() {
      setLoading(true);
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        // Fetch parcel counts for each collection
        const collectionsWithCounts = await Promise.all(
          (data as Collection[]).map(async (col) => {
            const { data: parcels } = await supabase
              .from('collection_items')
              .select('status')
              .eq('collection_id', col.id);

            const statusCounts: Record<string, number> = {};
            parcels?.forEach((p: { status: string }) => {
              statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
            });

            return {
              ...col,
              parcel_count: parcels?.length || 0,
              status_counts: statusCounts as Record<ParcelStatus, number>,
            };
          })
        );
        setCollections(collectionsWithCounts);
      }
      setLoading(false);
    }
    fetchCollections();
  }, [supabase]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('collections')
      .insert({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        tags: newTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        share_mode: newShareMode,
        owner_id: user?.id,
      })
      .select()
      .single();

    if (!error && data) {
      setCollections((prev) => [{ ...data, parcel_count: 0, status_counts: {} } as Collection, ...prev]);
      setShowNewDialog(false);
      setNewTitle('');
      setNewDescription('');
      setNewTags('');
      setNewShareMode('private');
    }
    setCreating(false);
  }

  async function handleDuplicate(col: Collection) {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        title: `${col.title} (Copy)`,
        description: col.description,
        tags: col.tags,
        share_mode: 'private',
        owner_id: user?.id,
        org_id: col.org_id,
      })
      .select()
      .single();

    if (!error && data) {
      setCollections((prev) => [{ ...data, parcel_count: 0, status_counts: {} } as Collection, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (!error) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#F9FAFB]">Collections</h1>
        <Button
          className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90"
          onClick={() => setShowNewDialog(true)}
        >
          <Plus className="h-4 w-4" />
          New Collection
        </Button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
        </div>
      ) : collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <FolderOpen className="mb-3 h-12 w-12 text-[#374151]" />
          <p className="text-[#9CA3AF]">No collections yet. Create one to organize your parcels.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <Card
              key={col.id}
              className="group border-[#374151] bg-[#1F2937] transition-all hover:border-[#F59E0B]/40 cursor-pointer"
            >
              <CardContent>
                <div className="flex items-start justify-between">
                  <Link href={`/app/collections/${col.id}`} className="min-w-0 flex-1">
                    <h3 className="font-medium text-[#F9FAFB] truncate hover:text-[#F59E0B] transition-colors">
                      {col.title}
                    </h3>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <button className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#374151]">
                      <DropdownMenuItem
                        className="text-[#F9FAFB] focus:bg-[#374151]"
                        onClick={() => router.push(`/app/collections/${col.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-[#F9FAFB] focus:bg-[#374151]">
                        <Share2 className="h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-[#F9FAFB] focus:bg-[#374151]"
                        onClick={() => handleDuplicate(col)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-[#374151]" />
                      <DropdownMenuItem
                        variant="destructive"
                        className="focus:bg-red-500/10"
                        onClick={() => handleDelete(col.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {col.description && (
                  <p className="mt-1 text-xs text-[#9CA3AF] line-clamp-2">{col.description}</p>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-[#9CA3AF]">
                  <span className="font-medium text-[#F9FAFB]">{col.parcel_count || 0}</span>
                  <span>parcels</span>
                </div>

                {/* Status Distribution Bar */}
                <div className="mt-2">
                  <StatusBar
                    statusCounts={col.status_counts}
                    total={col.parcel_count || 0}
                  />
                </div>

                {/* Tags */}
                {col.tags && col.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {col.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-[#111827] text-[#9CA3AF] border-[#374151] text-[10px]"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelativeTime(col.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Collection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-[#1F2937] border-[#374151] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#F9FAFB]">New Collection</DialogTitle>
            <DialogDescription className="text-[#9CA3AF]">
              Create a new collection to organize parcels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-[#9CA3AF] text-xs">Name</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Inland Empire Industrial Sites"
                className="mt-1 border-[#374151] bg-[#111827] text-[#F9FAFB] placeholder:text-[#9CA3AF]/50"
              />
            </div>
            <div>
              <Label className="text-[#9CA3AF] text-xs">Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Optional description..."
                className="mt-1 border-[#374151] bg-[#111827] text-[#F9FAFB] placeholder:text-[#9CA3AF]/50 resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-[#9CA3AF] text-xs">Tags (comma-separated)</Label>
              <Input
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g., industrial, IE, logistics"
                className="mt-1 border-[#374151] bg-[#111827] text-[#F9FAFB] placeholder:text-[#9CA3AF]/50"
              />
            </div>
            <div>
              <Label className="text-[#9CA3AF] text-xs">Share Mode</Label>
              <div className="mt-1 flex rounded-lg border border-[#374151] bg-[#111827] p-0.5">
                {(['private', 'unlisted', 'public'] as ShareMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setNewShareMode(mode)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      newShareMode === mode
                        ? 'bg-[#1F2937] text-[#F9FAFB]'
                        : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-[#374151] bg-[#111827]">
            <DialogClose>
              <Button variant="outline" className="border-[#374151] text-[#9CA3AF]">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90"
              onClick={handleCreate}
              disabled={!newTitle.trim() || creating}
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
