'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Download,
  MoreHorizontal,
  Copy,
  Archive,
  FolderOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import type { MapRecord } from '@/types';

interface MapHeaderProps {
  mapId: string;
}

export default function MapHeader({ mapId }: MapHeaderProps) {
  const router = useRouter();
  const { profile, org } = useAuth();
  const { openModal } = useUIStore();
  const supabase = createClient();

  const [mapData, setMapData] = useState<MapRecord | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch map data
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('maps')
        .select('*')
        .eq('id', mapId)
        .single<MapRecord>();
      if (data) {
        setMapData(data);
        setTitle(data.title);
        setDescription(data.description ?? '');
      }
    }
    load();
  }, [mapId, supabase]);

  // Auto-focus when editing
  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const saveTitle = async () => {
    setEditingTitle(false);
    const trimmed = title.trim() || 'Untitled Map';
    setTitle(trimmed);
    await supabase.from('maps').update({ title: trimmed }).eq('id', mapId);
  };

  const saveDescription = async () => {
    setEditingDesc(false);
    await supabase
      .from('maps')
      .update({ description: description || null })
      .eq('id', mapId);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString();
  };

  const handleDuplicate = async () => {
    setMenuOpen(false);
    if (!mapData) return;
    const { data } = await supabase
      .from('maps')
      .insert({
        owner_id: mapData.owner_id,
        org_id: mapData.org_id,
        title: `${mapData.title} (Copy)`,
        description: mapData.description,
        center_lng: mapData.center_lng,
        center_lat: mapData.center_lat,
        zoom: mapData.zoom,
        basemap: mapData.basemap,
        share_mode: 'private',
        is_archived: false,
        tags: mapData.tags,
      })
      .select('id')
      .single();
    if (data) router.push(`/app/maps/${data.id}`);
  };

  const handleArchive = async () => {
    setMenuOpen(false);
    await supabase.from('maps').update({ is_archived: true }).eq('id', mapId);
    router.push('/app/maps');
  };

  return (
    <div className="flex h-14 items-center justify-between border-b border-[#374151] bg-[#111827] px-3">
      {/* Left section */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/app/maps')}
          className="flex h-8 w-8 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors"
          title="Back to maps"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                className="h-6 bg-transparent text-sm font-semibold text-[#F9FAFB] outline-none border-b border-[#F59E0B] w-64"
              />
            ) : (
              <button
                onClick={() => setEditingTitle(true)}
                className="truncate text-sm font-semibold text-[#F9FAFB] hover:text-[#F59E0B] transition-colors text-left"
              >
                {title || 'Untitled Map'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
            {editingDesc ? (
              <input
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                onKeyDown={(e) => e.key === 'Enter' && saveDescription()}
                placeholder="Add description..."
                className="h-4 bg-transparent text-[10px] text-[#9CA3AF] outline-none border-b border-[#F59E0B] w-48"
              />
            ) : (
              <button
                onClick={() => setEditingDesc(true)}
                className="truncate hover:text-[#F9FAFB] transition-colors"
              >
                {description || 'Add description...'}
              </button>
            )}
            {(profile?.full_name || org?.name) && (
              <>
                <span className="text-[#374151]">|</span>
                <span>
                  {profile?.full_name}
                  {org?.name ? ` / ${org.name}` : ''}
                </span>
              </>
            )}
            {mapData?.updated_at && (
              <>
                <span className="text-[#374151]">|</span>
                <span>{formatTime(mapData.updated_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => openModal('share')}
          className="flex h-8 items-center gap-1.5 rounded px-2.5 text-xs text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
        <button
          onClick={() => openModal('export')}
          className="flex h-8 items-center gap-1.5 rounded px-2.5 text-xs text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* More menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB] transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-[#1F2937] border border-[#374151] shadow-xl z-50 py-1">
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#F9FAFB] hover:bg-[#374151] transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-[#9CA3AF]" />
                Duplicate
              </button>
              <button
                onClick={handleArchive}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#F9FAFB] hover:bg-[#374151] transition-colors"
              >
                <Archive className="h-3.5 w-3.5 text-[#9CA3AF]" />
                Archive
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  // Navigate to collections view for this map
                  router.push('/app/dashboard');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#F9FAFB] hover:bg-[#374151] transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#9CA3AF]" />
                View in Collections
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
