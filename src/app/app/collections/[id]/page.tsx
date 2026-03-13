'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Download,
  Map,
  Pencil,
  Check,
  X,
  ArrowUpDown,
  Trash2,
  Eye,
  Loader2,
  GripVertical,
  Plus,
} from 'lucide-react';
import type { ShareMode, ParcelStatus, SalesComp } from '@/types';

interface CollectionData {
  id: string;
  title: string;
  description: string | null;
  share_mode: ShareMode;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Parcel {
  id: string;
  collection_id: string;
  parcel_id: string | null;
  address: string;
  apn: string;
  acreage: number | null;
  zoning: string | null;
  status: ParcelStatus;
  tags: string[];
  notes: string | null;
  created_at: string;
}

type ViewTab = 'table' | 'kanban' | 'comps';

const STATUSES: ParcelStatus[] = ['prospect', 'active', 'under_contract', 'closed', 'rejected', 'on_hold'];

const STATUS_COLORS: Record<ParcelStatus, { bg: string; text: string; label: string }> = {
  prospect: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Prospect' },
  active: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Active' },
  under_contract: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Under Contract' },
  closed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Closed' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
  on_hold: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'On Hold' },
};

const SHARE_BADGES: Record<ShareMode, { className: string; label: string }> = {
  private: { className: 'bg-[#374151] text-[#9CA3AF] border-[#374151]', label: 'Private' },
  unlisted: { className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Unlisted' },
  public: { className: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Public' },
};

// --- Sortable Kanban Card ---
function SortableKanbanCard({ parcel }: { parcel: Parcel }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: parcel.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="border-[#374151] bg-[#111827] mb-2 cursor-grab active:cursor-grabbing">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button {...listeners} className="mt-0.5 text-[#9CA3AF] hover:text-[#F9FAFB] shrink-0">
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#F9FAFB] truncate">{parcel.address || 'Untitled'}</p>
              <p className="text-xs text-[#9CA3AF] mt-0.5">{parcel.apn}</p>
              {parcel.acreage && (
                <p className="text-xs text-[#9CA3AF]">{parcel.acreage} acres</p>
              )}
              {parcel.zoning && (
                <Badge className="mt-1 bg-[#1F2937] text-[#9CA3AF] border-[#374151] text-[10px]">
                  {parcel.zoning}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  useAuth();
  const supabase = createClient();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewTab>('table');

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Table state
  const [sortField, setSortField] = useState<string>('address');
  const [sortAsc, setSortAsc] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ParcelStatus | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Comps state
  const [comps, setComps] = useState<SalesComp[]>([]);
  const [editingCompCell, setEditingCompCell] = useState<{ id: string; field: string } | null>(null);
  const [compEditValue, setCompEditValue] = useState('');

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    address: true,
    apn: true,
    acreage: true,
    zoning: true,
    status: true,
    tags: true,
    notes: true,
    created_at: true,
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: colData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (colData) {
        setCollection(colData as CollectionData);
        setTitleDraft(colData.title);
      }

      const { data: parcelData } = await supabase
        .from('collection_parcels')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

      if (parcelData) {
        setParcels(parcelData as Parcel[]);
      }

      setLoading(false);
    }
    fetchData();
  }, [supabase, collectionId]);

  // Title save
  async function saveTitle() {
    if (!titleDraft.trim() || !collection) return;
    const { error } = await supabase
      .from('collections')
      .update({ title: titleDraft.trim() })
      .eq('id', collection.id);
    if (!error) {
      setCollection((prev) => prev ? { ...prev, title: titleDraft.trim() } : prev);
    }
    setEditingTitle(false);
  }

  // Inline cell edit
  async function saveCellEdit(parcelId: string, field: string, value: string) {
    const updateData: Record<string, unknown> = {};
    if (field === 'acreage') {
      updateData[field] = parseFloat(value) || null;
    } else {
      updateData[field] = value || null;
    }

    const { error } = await supabase
      .from('collection_parcels')
      .update(updateData)
      .eq('id', parcelId);

    if (!error) {
      setParcels((prev) =>
        prev.map((p) => (p.id === parcelId ? { ...p, ...updateData } as Parcel : p))
      );
    }
    setEditingCell(null);
  }

  // Status change
  async function updateStatus(parcelId: string, status: ParcelStatus) {
    const { error } = await supabase
      .from('collection_parcels')
      .update({ status })
      .eq('id', parcelId);

    if (!error) {
      setParcels((prev) =>
        prev.map((p) => (p.id === parcelId ? { ...p, status } : p))
      );
    }
  }

  // Bulk delete
  async function bulkDelete() {
    const ids = Array.from(selectedRows);
    const { error } = await supabase
      .from('collection_parcels')
      .delete()
      .in('id', ids);
    if (!error) {
      setParcels((prev) => prev.filter((p) => !selectedRows.has(p.id)));
      setSelectedRows(new Set());
    }
  }

  // Sort parcels
  const sortedParcels = [...parcels]
    .filter((p) => statusFilter === 'all' || p.status === statusFilter)
    .sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortField] ?? '';
      const bv = (b as unknown as Record<string, unknown>)[sortField] ?? '';
      const cmp = String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // Kanban drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    // The over target contains the status as data
    const draggedParcel = parcels.find((p) => p.id === active.id);
    if (!draggedParcel) return;
  }

  // Comps
  function addComp() {
    const newComp: SalesComp = {
      id: crypto.randomUUID(),
      address: '',
      sale_date: '',
      sale_price: 0,
      building_sf: 0,
      land_sf: 0,
      price_psf: 0,
      land_price_per_acre: 0,
      zoning: '',
      clear_height: 0,
      notes: '',
    };
    setComps((prev) => [...prev, newComp]);
  }

  function updateComp(id: string, field: string, value: string) {
    setComps((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const numFields = ['sale_price', 'building_sf', 'land_sf', 'price_psf', 'land_price_per_acre', 'clear_height'];
        return {
          ...c,
          [field]: numFields.includes(field) ? parseFloat(value) || 0 : value,
        };
      })
    );
  }

  function removeComp(id: string) {
    setComps((prev) => prev.filter((c) => c.id !== id));
  }

  // Comps summary stats
  const compsSummary = comps.length > 0
    ? {
        avgPrice: comps.reduce((s, c) => s + c.sale_price, 0) / comps.length,
        avgPsf: comps.reduce((s, c) => s + c.price_psf, 0) / comps.length,
        avgLandPerAcre: comps.reduce((s, c) => s + c.land_price_per_acre, 0) / comps.length,
        avgBldgSf: comps.reduce((s, c) => s + c.building_sf, 0) / comps.length,
      }
    : null;

  const columns = [
    { key: 'address', label: 'Address' },
    { key: 'apn', label: 'APN' },
    { key: 'acreage', label: 'Acreage' },
    { key: 'zoning', label: 'Zoning' },
    { key: 'status', label: 'Status' },
    { key: 'tags', label: 'Tags' },
    { key: 'notes', label: 'Notes' },
    { key: 'created_at', label: 'Date Added' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#0A0E1A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center bg-[#0A0E1A]">
        <p className="text-[#9CA3AF]">Collection not found.</p>
        <Button
          variant="ghost"
          className="mt-2 text-[#F59E0B]"
          onClick={() => router.push('/app/collections')}
        >
          Back to Collections
        </Button>
      </div>
    );
  }

  const shareBadge = SHARE_BADGES[collection.share_mode];

  return (
    <div className="min-h-full bg-[#0A0E1A] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  className="h-9 w-80 border-[#374151] bg-[#111827] text-lg font-semibold text-[#F9FAFB]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setTitleDraft(collection.title);
                      setEditingTitle(false);
                    }
                  }}
                />
                <button onClick={saveTitle} className="text-green-400 hover:text-green-300">
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(collection.title);
                    setEditingTitle(false);
                  }}
                  className="text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-[#F9FAFB]">{collection.title}</h1>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <Badge className={`${shareBadge.className} text-[10px] ml-2`}>
                  {shareBadge.label}
                </Badge>
              </div>
            )}
            {collection.description && (
              <p className="mt-1 text-sm text-[#9CA3AF]">{collection.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]">
              <Map className="h-4 w-4" />
              Open All in Map
            </Button>
            <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex rounded-lg border border-[#374151] bg-[#111827] p-0.5">
          {([
            { key: 'table' as ViewTab, label: 'TABLE' },
            { key: 'kanban' as ViewTab, label: 'KANBAN' },
            { key: 'comps' as ViewTab, label: 'COMPS ANALYSIS' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                activeView === tab.key
                  ? 'bg-[#1F2937] text-[#F9FAFB]'
                  : 'text-[#9CA3AF] hover:text-[#F9FAFB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW */}
      {activeView === 'table' && (
        <div>
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <div className="flex rounded-lg border border-[#374151] bg-[#111827] p-0.5">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-md px-2 py-1 text-xs transition-colors ${
                    statusFilter === 'all' ? 'bg-[#1F2937] text-[#F9FAFB]' : 'text-[#9CA3AF]'
                  }`}
                >
                  All
                </button>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                      statusFilter === s ? 'bg-[#1F2937] text-[#F9FAFB]' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {STATUS_COLORS[s].label}
                  </button>
                ))}
              </div>

              {/* Column visibility toggle */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-[#374151] bg-[#111827] text-[#9CA3AF]"
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Columns
                </Button>
                {showColumnPicker && (
                  <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-[#374151] bg-[#1F2937] p-2 shadow-lg">
                    {columns.map((col) => (
                      <label
                        key={col.key}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-[#F9FAFB] hover:bg-[#374151]"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [col.key]: !prev[col.key],
                            }))
                          }
                          className="rounded border-[#374151]"
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk actions */}
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#9CA3AF]">{selectedRows.size} selected</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Table */}
          <Card className="border-[#374151] bg-[#1F2937] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#374151]">
                    <th className="w-8 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === sortedParcels.length && sortedParcels.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(new Set(sortedParcels.map((p) => p.id)));
                          } else {
                            setSelectedRows(new Set());
                          }
                        }}
                        className="rounded border-[#374151]"
                      />
                    </th>
                    {columns
                      .filter((c) => visibleColumns[c.key])
                      .map((col) => (
                        <th
                          key={col.key}
                          className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF] hover:text-[#F9FAFB]"
                          onClick={() => toggleSort(col.key)}
                        >
                          <div className="flex items-center gap-1">
                            {col.label}
                            {sortField === col.key && (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]">
                  {sortedParcels.map((parcel) => (
                    <tr
                      key={parcel.id}
                      className="hover:bg-[#111827]/50 transition-colors"
                    >
                      <td className="w-8 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(parcel.id)}
                          onChange={() => {
                            setSelectedRows((prev) => {
                              const next = new Set(prev);
                              if (next.has(parcel.id)) next.delete(parcel.id);
                              else next.add(parcel.id);
                              return next;
                            });
                          }}
                          className="rounded border-[#374151]"
                        />
                      </td>
                      {columns
                        .filter((c) => visibleColumns[c.key])
                        .map((col) => {
                          const isEditing =
                            editingCell?.id === parcel.id && editingCell?.field === col.key;

                          if (col.key === 'status') {
                            return (
                              <td key={col.key} className="px-4 py-2">
                                <select
                                  value={parcel.status}
                                  onChange={(e) =>
                                    updateStatus(parcel.id, e.target.value as ParcelStatus)
                                  }
                                  className="rounded border-[#374151] bg-[#111827] px-2 py-1 text-xs text-[#F9FAFB]"
                                >
                                  {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {STATUS_COLORS[s].label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          }

                          if (col.key === 'tags') {
                            return (
                              <td key={col.key} className="px-4 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {parcel.tags?.map((t) => (
                                    <Badge
                                      key={t}
                                      className="bg-[#111827] text-[#9CA3AF] border-[#374151] text-[10px]"
                                    >
                                      {t}
                                    </Badge>
                                  ))}
                                </div>
                              </td>
                            );
                          }

                          if (col.key === 'created_at') {
                            return (
                              <td key={col.key} className="px-4 py-2 text-xs text-[#9CA3AF]">
                                {new Date(parcel.created_at).toLocaleDateString()}
                              </td>
                            );
                          }

                          // Editable cell
                          const cellValue = String(
                            (parcel as unknown as Record<string, unknown>)[col.key] ?? ''
                          );

                          return (
                            <td key={col.key} className="px-4 py-2">
                              {isEditing ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => saveCellEdit(parcel.id, col.key, editValue)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveCellEdit(parcel.id, col.key, editValue);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="h-7 border-[#F59E0B] bg-[#111827] text-xs text-[#F9FAFB]"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer text-sm text-[#F9FAFB] hover:text-[#F59E0B]"
                                  onClick={() => {
                                    setEditingCell({ id: parcel.id, field: col.key });
                                    setEditValue(cellValue);
                                  }}
                                >
                                  {cellValue || '--'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                  {sortedParcels.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.filter((c) => visibleColumns[c.key]).length + 1}
                        className="px-4 py-12 text-center text-sm text-[#9CA3AF]"
                      >
                        No parcels in this collection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* KANBAN VIEW */}
      {activeView === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {STATUSES.map((status) => {
              const statusParcels = parcels.filter((p) => p.status === status);
              const sc = STATUS_COLORS[status];

              return (
                <div key={status} className="flex flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${sc.bg} ${sc.text} border-transparent text-[10px]`}>
                        {sc.label}
                      </Badge>
                      <span className="text-xs text-[#9CA3AF]">{statusParcels.length}</span>
                    </div>
                  </div>
                  <div className="min-h-[200px] rounded-lg border border-[#374151] bg-[#1F2937] p-2">
                    <SortableContext
                      items={statusParcels.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {statusParcels.map((parcel) => (
                        <SortableKanbanCard key={parcel.id} parcel={parcel} />
                      ))}
                    </SortableContext>
                    {statusParcels.length === 0 && (
                      <div className="flex h-20 items-center justify-center">
                        <p className="text-xs text-[#9CA3AF]">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      {/* COMPS ANALYSIS */}
      {activeView === 'comps' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F9FAFB]">Comparable Sales Analysis</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                onClick={addComp}
              >
                <Plus className="h-4 w-4" />
                Add Comp
              </Button>
              <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
                <Download className="h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </div>

          <Card className="border-[#374151] bg-[#1F2937] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#374151]">
                    {[
                      'Address',
                      'Sale Date',
                      'Sale Price',
                      'Bldg SF',
                      'Land Acres',
                      '$/SF',
                      'Land $/Acre',
                      'Zoning',
                      'Clear Height',
                      'Notes',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#9CA3AF] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]">
                  {comps.map((comp) => {
                    const compFields = [
                      { key: 'address', type: 'text' },
                      { key: 'sale_date', type: 'text' },
                      { key: 'sale_price', type: 'number' },
                      { key: 'building_sf', type: 'number' },
                      { key: 'land_sf', type: 'number' },
                      { key: 'price_psf', type: 'number' },
                      { key: 'land_price_per_acre', type: 'number' },
                      { key: 'zoning', type: 'text' },
                      { key: 'clear_height', type: 'number' },
                      { key: 'notes', type: 'text' },
                    ];

                    return (
                      <tr key={comp.id} className="hover:bg-[#111827]/50">
                        {compFields.map(({ key, type }) => {
                          const isEditing =
                            editingCompCell?.id === comp.id && editingCompCell?.field === key;
                          const val = String(
                            (comp as unknown as Record<string, unknown>)[key] ?? ''
                          );

                          return (
                            <td key={key} className="px-3 py-2">
                              {isEditing ? (
                                <Input
                                  value={compEditValue}
                                  onChange={(e) => setCompEditValue(e.target.value)}
                                  type={type === 'number' ? 'number' : 'text'}
                                  onBlur={() => {
                                    updateComp(comp.id, key, compEditValue);
                                    setEditingCompCell(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateComp(comp.id, key, compEditValue);
                                      setEditingCompCell(null);
                                    }
                                    if (e.key === 'Escape') setEditingCompCell(null);
                                  }}
                                  className="h-7 w-24 border-[#F59E0B] bg-[#111827] text-xs text-[#F9FAFB]"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer text-xs text-[#F9FAFB] hover:text-[#F59E0B] whitespace-nowrap"
                                  onClick={() => {
                                    setEditingCompCell({ id: comp.id, field: key });
                                    setCompEditValue(val === '0' && type === 'number' ? '' : val);
                                  }}
                                >
                                  {type === 'number' && val !== '' && val !== '0'
                                    ? Number(val).toLocaleString()
                                    : val || '--'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeComp(comp.id)}
                            className="text-[#9CA3AF] hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {comps.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-sm text-[#9CA3AF]">
                        No comps added. Click &quot;Add Comp&quot; to start.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Summary row */}
                {compsSummary && (
                  <tfoot>
                    <tr className="border-t-2 border-[#374151] bg-[#111827]">
                      <td className="px-3 py-2 text-xs font-medium text-[#F59E0B]">
                        Averages ({comps.length} comps)
                      </td>
                      <td className="px-3 py-2 text-xs text-[#9CA3AF]">--</td>
                      <td className="px-3 py-2 text-xs font-medium text-[#F9FAFB]">
                        ${compsSummary.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-[#F9FAFB]">
                        {compsSummary.avgBldgSf.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-3 py-2 text-xs text-[#9CA3AF]">--</td>
                      <td className="px-3 py-2 text-xs font-medium text-[#F9FAFB]">
                        ${compsSummary.avgPsf.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-[#F9FAFB]">
                        ${compsSummary.avgLandPerAcre.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
