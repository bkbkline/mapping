'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  RefreshCw,
  Trash2,
  MoreVertical,
  FileText,
  Loader2,
  FileSpreadsheet,
  MapIcon,
  FileCode,
} from 'lucide-react';
import type { ExportType, ExportStatus } from '@/types';

interface ExportRecord {
  id: string;
  export_type: ExportType;
  source_type: string;
  source_id: string;
  source_name: string | null;
  parameters: Record<string, unknown>;
  status: ExportStatus;
  file_url: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; email: string } | null;
}

const STATUS_STYLES: Record<ExportStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending' },
  processing: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Processing' },
  complete: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Complete' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
};

const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  pdf_map: 'PDF Map',
  csv_parcels: 'CSV Parcels',
  xlsx_parcels: 'Excel Parcels',
  geojson: 'GeoJSON',
  kml: 'KML',
};

function getExportIcon(type: ExportType) {
  switch (type) {
    case 'pdf_map':
      return <MapIcon className="h-4 w-4" />;
    case 'csv_parcels':
      return <FileText className="h-4 w-4" />;
    case 'xlsx_parcels':
      return <FileSpreadsheet className="h-4 w-4" />;
    case 'geojson':
    case 'kml':
      return <FileCode className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ExportsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExports() {
      setLoading(true);
      const { data, error } = await supabase
        .from('exports')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setExports(data as ExportRecord[]);
      }
      setLoading(false);
    }
    fetchExports();
  }, [supabase]);

  async function handleRerun(exp: ExportRecord) {
    const { data, error } = await supabase
      .from('exports')
      .insert({
        export_type: exp.export_type,
        source_type: exp.source_type,
        source_id: exp.source_id,
        source_name: exp.source_name,
        parameters: exp.parameters,
        status: 'pending',
        owner_id: user?.id,
      })
      .select('*, profiles(full_name, email)')
      .single();

    if (!error && data) {
      setExports((prev) => [data as ExportRecord, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('exports').delete().eq('id', id);
    if (!error) {
      setExports((prev) => prev.filter((e) => e.id !== id));
    }
  }

  function handleDownload(exp: ExportRecord) {
    if (exp.file_url) {
      window.open(exp.file_url, '_blank');
    }
  }

  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#F9FAFB]">Exports</h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">
          View and manage your exported files.
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
        </div>
      ) : exports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Download className="mb-3 h-12 w-12 text-[#374151]" />
          <p className="text-[#9CA3AF]">No exports yet.</p>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Exports will appear here when you export maps or collections.
          </p>
        </div>
      ) : (
        <Card className="border-[#374151] bg-[#1F2937] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#374151] text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Export Type
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Source
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Parameters
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Created By
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Created At
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-[#9CA3AF]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#374151]">
                {exports.map((exp) => {
                  const statusStyle = STATUS_STYLES[exp.status];
                  return (
                    <tr key={exp.id} className="hover:bg-[#111827]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#111827] text-[#9CA3AF]">
                            {getExportIcon(exp.export_type)}
                          </div>
                          <span className="text-sm font-medium text-[#F9FAFB]">
                            {EXPORT_TYPE_LABELS[exp.export_type] || exp.export_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm text-[#F9FAFB]">
                            {exp.source_name || '--'}
                          </span>
                          <p className="text-xs text-[#9CA3AF] capitalize">{exp.source_type}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          {exp.parameters && Object.keys(exp.parameters).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(exp.parameters)
                                .slice(0, 3)
                                .map(([key, val]) => (
                                  <Badge
                                    key={key}
                                    className="bg-[#111827] text-[#9CA3AF] border-[#374151] text-[10px]"
                                  >
                                    {key}: {String(val)}
                                  </Badge>
                                ))}
                              {Object.keys(exp.parameters).length > 3 && (
                                <Badge className="bg-[#111827] text-[#9CA3AF] border-[#374151] text-[10px]">
                                  +{Object.keys(exp.parameters).length - 3} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[#9CA3AF]">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${statusStyle.bg} ${statusStyle.text} border-transparent text-[10px]`}
                        >
                          {exp.status === 'processing' && (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          )}
                          {statusStyle.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9CA3AF]">
                        {exp.profiles?.full_name || exp.profiles?.email || '--'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9CA3AF] whitespace-nowrap">
                        {formatDateTime(exp.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {exp.status === 'complete' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              onClick={() => handleDownload(exp)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <button className="rounded-md p-1 text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1F2937] border-[#374151]">
                              {exp.status === 'complete' && (
                                <DropdownMenuItem
                                  className="text-[#F9FAFB] focus:bg-[#374151]"
                                  onClick={() => handleDownload(exp)}
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-[#F9FAFB] focus:bg-[#374151]"
                                onClick={() => handleRerun(exp)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Re-run
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-[#374151]" />
                              <DropdownMenuItem
                                variant="destructive"
                                className="focus:bg-red-500/10"
                                onClick={() => handleDelete(exp.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
