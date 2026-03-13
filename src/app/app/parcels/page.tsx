'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  Eye,
} from 'lucide-react';
import type { Parcel } from '@/types';

const PAGE_SIZE = 25;

export default function ParcelsListPage() {
  const router = useRouter();
  const { org } = useAuth();
  const supabase = createClient();

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const loadParcels = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);

    let query = supabase
      .from('parcels')
      .select('*', { count: 'exact' })
      .eq('org_id', org.id)
      .order('updated_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (search.trim()) {
      query = query.or(
        `situs_address.ilike.%${search.trim()}%,apn.ilike.%${search.trim()}%`
      );
    }

    const { data, count } = await query;
    if (data) setParcels(data);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  }, [org?.id, page, search, supabase]);

  useEffect(() => {
    loadParcels();
  }, [loadParcels]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-full bg-[#0A0E1A] p-4 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#F59E0B]" />
          <h1 className="text-xl font-bold text-[#F9FAFB]">Parcels</h1>
          <span className="rounded-full bg-[#1F2937] px-2.5 py-0.5 text-xs text-[#9CA3AF]">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          placeholder="Search by address or APN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
            {loading ? (
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
                  {search ? 'No parcels match your search.' : 'No parcels found.'}
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
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-[#9CA3AF]">
            Showing {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
