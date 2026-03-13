'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Map,
  ChevronRight,
  Clock,
  X,
  Layers,
} from 'lucide-react';
import type { MapRecord } from '@/types';
import type mapboxgl from 'mapbox-gl';

const DashboardMap = dynamic(
  () => import('@/components/map/DashboardMap'),
  { ssr: false, loading: () => null },
);

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

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  const [recentMaps, setRecentMaps] = useState<MapRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || '';

  useEffect(() => {
    async function fetchMaps() {
      setLoading(true);
      const { data } = await supabase
        .from('maps')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .limit(20);
      setRecentMaps((data as MapRecord[]) || []);
      setLoading(false);
    }
    fetchMaps();
  }, [supabase]);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const flyToMap = useCallback((mapRecord: MapRecord) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({
      center: [mapRecord.center_lng, mapRecord.center_lat],
      zoom: mapRecord.zoom,
      duration: 2000,
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Full-screen satellite map background */}
      <DashboardMap onMapReady={handleMapReady} />

      {/* Floating greeting + quick actions — top left */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-3">
        {/* Welcome card */}
        <div className="rounded-xl bg-[#0A0E1A]/80 backdrop-blur-md border border-[#374151]/60 px-5 py-4 shadow-2xl">
          <h1 className="text-lg font-semibold text-[#F9FAFB]">
            {firstName ? `Welcome, ${firstName}` : 'Land Intel'}
          </h1>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {recentMaps.length} map{recentMaps.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link href="/app/maps/new">
            <Button
              size="sm"
              className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90 shadow-lg"
            >
              <Plus className="mr-1 h-4 w-4" />
              New Map
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            className="border-[#374151]/60 bg-[#0A0E1A]/80 backdrop-blur-md text-[#F9FAFB] hover:bg-[#1F2937]/80 shadow-lg"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            <Layers className="mr-1 h-4 w-4" />
            My Maps
          </Button>
        </div>
      </div>

      {/* Slide-out Maps panel — left side */}
      <div
        className={`absolute left-0 top-0 z-20 h-full transition-transform duration-300 ease-in-out ${
          panelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full w-80 flex-col bg-[#0A0E1A]/90 backdrop-blur-xl border-r border-[#374151]/60 shadow-2xl">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-[#374151]/60 px-4 py-3">
            <h2 className="text-sm font-semibold text-[#F9FAFB]">My Maps</h2>
            <button
              onClick={() => setPanelOpen(false)}
              className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* New map button */}
          <div className="px-4 py-3 border-b border-[#374151]/40">
            <Link href="/app/maps/new" className="block">
              <Button
                size="sm"
                className="w-full bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create New Map
              </Button>
            </Link>
          </div>

          {/* Maps list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-[#374151]/30 px-4 py-3 animate-pulse"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#374151]/50" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-[#374151]/50" />
                      <div className="h-2 w-1/2 rounded bg-[#374151]/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentMaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <Map className="mb-3 h-10 w-10 text-[#374151]" />
                <p className="text-sm text-[#9CA3AF]">No maps yet</p>
                <p className="mt-1 text-xs text-[#9CA3AF]/70">
                  Click &quot;Create New Map&quot; to get started
                </p>
              </div>
            ) : (
              recentMaps.map((mapRecord) => (
                <button
                  key={mapRecord.id}
                  className="group flex w-full items-center gap-3 border-b border-[#374151]/30 px-4 py-3 text-left transition-colors hover:bg-[#1F2937]/60"
                  onClick={() => {
                    flyToMap(mapRecord);
                    setPanelOpen(false);
                  }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1F2937] group-hover:bg-[#F59E0B]/10">
                    <Map className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#F59E0B]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#F9FAFB]">
                      {mapRecord.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(mapRecord.updated_at)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/app/maps/${mapRecord.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md p-1.5 text-[#9CA3AF] opacity-0 transition-opacity hover:bg-[#374151] hover:text-[#F9FAFB] group-hover:opacity-100"
                    title="Open full map workspace"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </button>
              ))
            )}
          </div>

          {/* Footer link */}
          {recentMaps.length > 0 && (
            <div className="border-t border-[#374151]/60 px-4 py-3">
              <Link href="/app/maps">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  View all maps
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Panel toggle tab (visible when panel is closed) */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-r-lg bg-[#0A0E1A]/80 backdrop-blur-md border border-l-0 border-[#374151]/60 px-1.5 py-4 text-[#9CA3AF] shadow-lg transition-colors hover:bg-[#1F2937]/80 hover:text-[#F9FAFB]"
          title="Open maps panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
