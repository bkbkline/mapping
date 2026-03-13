'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IndustrialScorecard } from '@/components/parcels/IndustrialScorecard';
import { FeasibilityCalculator } from '@/components/parcels/FeasibilityCalculator';
import { SalesCompsTable } from '@/components/parcels/SalesCompsTable';
import { ZoningPanel } from '@/components/parcels/ZoningPanel';
import { DriveTimeIsochrone } from '@/components/parcels/DriveTimeIsochrone';
import {
  Loader2,
  ArrowLeft,
  Map,
  FileDown,
  FileText,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  LandPlot,
  Building2,
  DollarSign,
  User,
  Database,
  Tag,
  Clock,
  MapPin,
} from 'lucide-react';
import type {
  Parcel,
  Collection,
  CollectionItem,
  ParcelStatus,
  MapRecord,
  AuditLogEntry,
} from '@/types';

const STATUS_OPTIONS: { value: ParcelStatus; label: string; color: string }[] = [
  { value: 'prospect', label: 'Prospect', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'active', label: 'Active', color: 'bg-green-500/20 text-green-400' },
  { value: 'under_contract', label: 'Under Contract', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-500/20 text-gray-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400' },
];

export default function ParcelProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { org } = useAuth();
  const supabase = createClient();

  const parcelId = params.id as string;

  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionItem, setCollectionItem] = useState<CollectionItem | null>(null);
  const [status, setStatus] = useState<ParcelStatus>('prospect');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [notes, setNotes] = useState('');
  const [attributesExpanded, setAttributesExpanded] = useState(false);
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [relatedMaps, setRelatedMaps] = useState<MapRecord[]>([]);
  const [activityLog, setActivityLog] = useState<AuditLogEntry[]>([]);

  const loadParcel = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('parcels')
      .select('*')
      .eq('id', parcelId)
      .single();
    if (data) setParcel(data);
    setLoading(false);
  }, [parcelId, supabase]);

  const loadCollections = useCallback(async () => {
    if (!org?.id) return;
    const { data } = await supabase
      .from('collections')
      .select('*')
      .eq('org_id', org.id)
      .order('title');
    if (data) setCollections(data);
  }, [org?.id, supabase]);

  const loadCollectionItem = useCallback(async () => {
    const { data } = await supabase
      .from('collection_items')
      .select('*')
      .eq('parcel_id', parcelId)
      .limit(1)
      .maybeSingle();
    if (data) {
      setCollectionItem(data);
      setStatus(data.status);
      setTags(data.tags || []);
      setNotes(data.notes || '');
    }
  }, [parcelId, supabase]);

  const loadRelatedMaps = useCallback(async () => {
    if (!org?.id) return;
    const { data } = await supabase
      .from('maps')
      .select('*')
      .eq('org_id', org.id)
      .order('updated_at', { ascending: false })
      .limit(5);
    if (data) setRelatedMaps(data);
  }, [org?.id, supabase]);

  const loadActivity = useCallback(async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('resource_id', parcelId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setActivityLog(data);
  }, [parcelId, supabase]);

  useEffect(() => {
    loadParcel();
    loadCollections();
    loadCollectionItem();
    loadRelatedMaps();
    loadActivity();
  }, [loadParcel, loadCollections, loadCollectionItem, loadRelatedMaps, loadActivity]);

  const handleStatusChange = async (newStatus: ParcelStatus | null) => {
    if (!newStatus) return;
    const s = newStatus;
    setStatus(s);
    if (collectionItem) {
      await supabase
        .from('collection_items')
        .update({ status: s, updated_at: new Date().toISOString() })
        .eq('id', collectionItem.id);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    const newTags = [...tags, tagInput.trim()];
    setTags(newTags);
    setTagInput('');
    if (collectionItem) {
      supabase
        .from('collection_items')
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq('id', collectionItem.id);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    if (collectionItem) {
      supabase
        .from('collection_items')
        .update({ tags: newTags, updated_at: new Date().toISOString() })
        .eq('id', collectionItem.id);
    }
  };

  const handleNotesChange = async (value: string) => {
    setNotes(value);
    if (collectionItem) {
      await supabase
        .from('collection_items')
        .update({ notes: value, updated_at: new Date().toISOString() })
        .eq('id', collectionItem.id);
    }
  };

  const handleAddToCollection = async (collectionId: string | null) => {
    if (!collectionId) return;
    if (collectionItem) return;
    const { data } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        parcel_id: parcelId,
        status: 'prospect',
        tags: [],
        notes: '',
        custom_fields: {},
      })
      .select()
      .single();
    if (data) {
      setCollectionItem(data);
      setStatus(data.status);
    }
  };

  const handleAddCustomField = async () => {
    if (!customFieldKey.trim() || !parcel) return;
    const updatedAttrs = {
      ...parcel.raw_attributes,
      [customFieldKey.trim()]: customFieldValue,
    };
    await supabase
      .from('parcels')
      .update({ raw_attributes: updatedAttrs, updated_at: new Date().toISOString() })
      .eq('id', parcelId);
    setParcel({ ...parcel, raw_attributes: updatedAttrs });
    setCustomFieldKey('');
    setCustomFieldValue('');
  };

  // Extract lat/lng from geometry centroid (approximate)
  const getCenter = (): [number, number] | null => {
    if (!parcel?.geometry) return null;
    try {
      const coords = parcel.geometry.coordinates[0][0];
      if (!coords || coords.length === 0) return null;
      const lats = coords.map((c: number[]) => c[1]);
      const lngs = coords.map((c: number[]) => c[0]);
      return [
        lats.reduce((a: number, b: number) => a + b, 0) / lats.length,
        lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length,
      ];
    } catch {
      return null;
    }
  };

  const center = getCenter();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-[#9CA3AF]">Parcel not found.</p>
        <Button
          variant="outline"
          className="border-[#374151] text-[#9CA3AF]"
          onClick={() => router.push('/app/parcels')}
        >
          Back to Parcels
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Acreage',
      value: parcel.acreage ? `${parcel.acreage.toFixed(2)} ac` : '--',
      icon: LandPlot,
    },
    {
      label: 'Zoning',
      value: parcel.zoning || '--',
      icon: MapPin,
    },
    {
      label: 'Land Use',
      value: parcel.land_use_code || '--',
      icon: Building2,
    },
    {
      label: 'Assessed Value',
      value: parcel.assessed_value
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(parcel.assessed_value)
        : '--',
      icon: DollarSign,
    },
    {
      label: 'Owner',
      value: parcel.owner_name || '--',
      icon: User,
    },
    {
      label: 'Data Source',
      value: parcel.data_source || '--',
      icon: Database,
    },
  ];

  return (
    <div className="min-h-full bg-[#0A0E1A] p-4 lg:p-6">
      {/* Back button */}
      <Button
        variant="ghost"
        className="mb-4 gap-2 text-[#9CA3AF] hover:text-[#F9FAFB]"
        onClick={() => router.push('/app/parcels')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Parcels
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Mini Map Placeholder */}
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-[#374151] bg-[#111827]">
            <div className="flex flex-col items-center gap-2 text-[#9CA3AF]">
              <Map className="h-8 w-8" />
              <span className="text-sm">Map View</span>
              {center && (
                <span className="text-xs">
                  {center[0].toFixed(6)}, {center[1].toFixed(6)}
                </span>
              )}
            </div>
          </div>

          {/* Title / APN / Location */}
          <div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">
              {parcel.situs_address || 'No Address'}
            </h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-[#9CA3AF]">
              {parcel.apn && <span>APN: {parcel.apn}</span>}
              {parcel.county && <span>{parcel.county}</span>}
              {parcel.state_abbr && <span>{parcel.state_abbr}</span>}
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-[#374151] bg-[#1F2937]">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <Icon className="h-3.5 w-3.5" />
                      {stat.label}
                    </div>
                    <p className="mt-1 text-sm font-semibold text-[#F9FAFB]">{stat.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Attributes Section */}
          <Card className="border-[#374151] bg-[#1F2937]">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setAttributesExpanded(!attributesExpanded)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-[#F9FAFB]">Attributes</CardTitle>
                {attributesExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                )}
              </div>
            </CardHeader>
            {attributesExpanded && (
              <CardContent className="space-y-3">
                {parcel.raw_attributes &&
                  Object.keys(parcel.raw_attributes).length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-[#374151]">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(parcel.raw_attributes).map(([key, val]) => (
                            <tr key={key} className="border-b border-[#374151]/50">
                              <td className="px-3 py-2 text-xs font-medium text-[#9CA3AF]">
                                {key}
                              </td>
                              <td className="px-3 py-2 text-xs text-[#F9FAFB]">
                                {String(val ?? '--')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                <div className="flex gap-2">
                  <Input
                    placeholder="Key"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    className="h-8 border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
                  />
                  <Input
                    placeholder="Value"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    className="h-8 border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomField}
                    className="shrink-0 gap-1 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Zoning Panel */}
          <ZoningPanel
            zoningCode={parcel.zoning}
            zoningDescription={parcel.zoning_description}
            orgId={parcel.org_id}
          />

          {/* Industrial Scorecard */}
          <IndustrialScorecard
            parcelId={parcelId}
            collectionItemId={collectionItem?.id ?? null}
          />

          {/* Feasibility Calculator */}
          <FeasibilityCalculator
            parcelId={parcelId}
            defaultLandCost={parcel.assessed_value ?? undefined}
          />

          {/* Sales Comps Table */}
          <SalesCompsTable parcelId={parcelId} />

          {/* Drive Time Isochrone */}
          <DriveTimeIsochrone
            parcelId={parcelId}
            lat={center?.[0]}
            lng={center?.[1]}
          />

          {/* Related Maps */}
          <Card className="border-[#374151] bg-[#1F2937]">
            <CardHeader>
              <CardTitle className="text-[#F9FAFB]">Related Maps</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedMaps.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No related maps found.</p>
              ) : (
                <div className="space-y-2">
                  {relatedMaps.map((m) => (
                    <button
                      key={m.id}
                      className="flex w-full items-center gap-3 rounded-lg border border-[#374151] bg-[#111827] p-3 text-left transition-colors hover:bg-[#1F2937]"
                      onClick={() => router.push(`/app/maps/${m.id}`)}
                    >
                      <Map className="h-4 w-4 shrink-0 text-[#F59E0B]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#F9FAFB]">
                          {m.title}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          Updated {new Date(m.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card className="border-[#374151] bg-[#1F2937]">
            <CardHeader>
              <CardTitle className="text-[#F9FAFB]">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              {activityLog.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No activity recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {activityLog.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 border-l-2 border-[#374151] pl-3"
                    >
                      <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                      <div>
                        <p className="text-sm text-[#F9FAFB]">{entry.action}</p>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-4">
          {/* Status Selector */}
          <Card className="border-[#374151] bg-[#1F2937]">
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#9CA3AF]">Status</Label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full border-[#374151] bg-[#111827] text-[#F9FAFB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#374151] bg-[#1F2937]">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${opt.color.split(' ')[0]}`}
                          />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator className="bg-[#374151]" />

              {/* Add to Collection */}
              <div className="space-y-2">
                <Label className="text-xs text-[#9CA3AF]">Add to Collection</Label>
                {collectionItem ? (
                  <Badge className="bg-[#F59E0B]/20 text-[#F59E0B]">
                    In Collection
                  </Badge>
                ) : (
                  <Select onValueChange={handleAddToCollection}>
                    <SelectTrigger className="w-full border-[#374151] bg-[#111827] text-[#F9FAFB]">
                      <SelectValue placeholder="Select collection..." />
                    </SelectTrigger>
                    <SelectContent className="border-[#374151] bg-[#1F2937]">
                      {collections.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator className="bg-[#374151]" />

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs text-[#9CA3AF]">Tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1 border-[#374151] text-[#9CA3AF]"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 hover:text-red-400"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="h-7 border-[#374151] bg-[#111827] text-[#F9FAFB] text-xs"
                  />
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={handleAddTag}
                    className="border-[#374151] text-[#9CA3AF]"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-[#374151]" />

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs text-[#9CA3AF]">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes about this parcel..."
                  className="min-h-[100px] border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
                />
              </div>

              <Separator className="bg-[#374151]" />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                  onClick={() => {
                    if (center) {
                      router.push(
                        `/app/maps/new?lat=${center[0]}&lng=${center[1]}&zoom=16`
                      );
                    } else {
                      router.push('/app/maps/new');
                    }
                  }}
                >
                  <Map className="h-4 w-4" />
                  Open in Map
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <FileText className="h-4 w-4" />
                  PDF Report
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                >
                  <FileDown className="h-4 w-4" />
                  CSV Row
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
