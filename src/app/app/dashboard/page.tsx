'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Map,
  FolderOpen,
  Bookmark,
  HardDrive,
  Plus,
  Upload,
  FolderPlus,
  Download,
  Clock,
  FileText,
  Trash2,
  Share2,
  Edit,
  Eye,
} from 'lucide-react';
import type { MapRecord } from '@/types';

interface DashboardStats {
  totalMaps: number;
  totalCollections: number;
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

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [stats, setStats] = useState<DashboardStats>({
    totalMaps: 0,
    totalCollections: 0,
    totalParcels: 0,
    storageUsed: '0 MB',
  });
  const [recentMaps, setRecentMaps] = useState<MapRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

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

        const { count: collectionsCount } = await supabase
          .from('collections')
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
          totalCollections: collectionsCount || 0,
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

  const statCards = [
    { label: 'Total Maps', value: stats.totalMaps, icon: Map, color: 'text-blue-400' },
    { label: 'Total Collections', value: stats.totalCollections, icon: FolderOpen, color: 'text-purple-400' },
    { label: 'Saved Parcels', value: stats.totalParcels, icon: Bookmark, color: 'text-green-400' },
    { label: 'Storage Used', value: stats.storageUsed, icon: HardDrive, color: 'text-[#F59E0B]' },
  ];

  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#F9FAFB]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">{formatDate(new Date())}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-[#374151] bg-[#1F2937]">
            <CardContent className="flex items-center gap-4 pt-0">
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/app/maps/new">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
            >
              <Plus className="h-5 w-5 text-[#F59E0B]" />
              <span className="text-xs">New Map</span>
            </Button>
          </Link>
          <Link href="/app/layers">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
            >
              <Upload className="h-5 w-5 text-blue-400" />
              <span className="text-xs">Import Layer</span>
            </Button>
          </Link>
          <Link href="/app/collections">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 border-[#374151] bg-[#111827] py-4 text-[#F9FAFB] hover:border-[#F59E0B]/40 hover:bg-[#1F2937]"
            >
              <FolderPlus className="h-5 w-5 text-purple-400" />
              <span className="text-xs">New Collection</span>
            </Button>
          </Link>
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
    </div>
  );
}
