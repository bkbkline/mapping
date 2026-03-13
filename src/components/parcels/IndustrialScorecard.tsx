'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  Save,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import type { IndustrialScorecard as ScorecardType } from '@/types';

interface IndustrialScorecardProps {
  parcelId: string;
  collectionItemId: string | null;
}

const defaultScorecard: ScorecardType = {
  clear_height: null,
  column_spacing: null,
  dock_doors: null,
  drive_in_doors: null,
  grade_level_doors: null,
  office_sf: null,
  total_building_sf: null,
  site_coverage: null,
  power: null,
  rail_access: false,
  truck_court_depth: null,
  year_built: null,
  sprinkler_system: null,
  construction_type: null,
  dock_levelers: false,
  cross_dock: false,
  trailer_parking_stalls: null,
  car_parking_stalls: null,
};

export function IndustrialScorecard({ collectionItemId }: IndustrialScorecardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardType>(defaultScorecard);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!collectionItemId) return;
    const load = async () => {
      const { data } = await supabase
        .from('collection_items')
        .select('custom_fields')
        .eq('id', collectionItemId)
        .single();
      if (data?.custom_fields?.scorecard) {
        setScorecard({ ...defaultScorecard, ...data.custom_fields.scorecard });
      }
    };
    load();
  }, [collectionItemId, supabase]);

  const handleSave = async () => {
    if (!collectionItemId) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from('collection_items')
      .select('custom_fields')
      .eq('id', collectionItemId)
      .single();

    const customFields = existing?.custom_fields ?? {};
    await supabase
      .from('collection_items')
      .update({
        custom_fields: { ...customFields, scorecard },
        updated_at: new Date().toISOString(),
      })
      .eq('id', collectionItemId);
    setSaving(false);
  };

  const updateField = <K extends keyof ScorecardType>(key: K, value: ScorecardType[K]) => {
    setScorecard((prev) => ({ ...prev, [key]: value }));
  };

  const numInput = (label: string, key: keyof ScorecardType, suffix?: string) => (
    <div className="space-y-1">
      <Label className="text-xs text-[#9CA3AF]">
        {label}
        {suffix ? ` (${suffix})` : ''}
      </Label>
      <Input
        type="number"
        value={(scorecard[key] as number) ?? ''}
        onChange={(e) =>
          updateField(key, e.target.value === '' ? null : Number(e.target.value) as never)
        }
        className="h-8 border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
        placeholder="--"
      />
    </div>
  );

  const textInput = (label: string, key: keyof ScorecardType) => (
    <div className="space-y-1">
      <Label className="text-xs text-[#9CA3AF]">{label}</Label>
      <Input
        type="text"
        value={String(scorecard[key] ?? '')}
        onChange={(e) => updateField(key, (e.target.value || null) as never)}
        className="h-8 border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm"
        placeholder="--"
      />
    </div>
  );

  if (!collectionItemId) {
    return (
      <Card className="border-[#374151] bg-[#1F2937]">
        <CardContent className="flex items-center gap-3 py-6">
          <AlertTriangle className="h-5 w-5 text-[#F59E0B]" />
          <div>
            <p className="text-sm font-medium text-[#F9FAFB]">Industrial Scorecard</p>
            <p className="text-xs text-[#9CA3AF]">
              Add this parcel to a collection first to enable the scorecard.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#374151] bg-[#1F2937]">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#F59E0B]" />
            <CardTitle className="text-[#F9FAFB]">Industrial Scorecard</CardTitle>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {numInput('Clear Height', 'clear_height', 'ft')}
            {textInput('Column Spacing', 'column_spacing')}
            {numInput('Dock Doors', 'dock_doors')}
            {numInput('Drive-in Doors', 'drive_in_doors')}
            {numInput('Grade-level Doors', 'grade_level_doors')}
            {numInput('Office SF', 'office_sf')}
            {numInput('Total Building SF', 'total_building_sf')}
            {numInput('Site Coverage', 'site_coverage', '%')}
            {textInput('Power', 'power')}
            {numInput('Truck Court Depth', 'truck_court_depth', 'ft')}
            {numInput('Year Built', 'year_built')}
            {numInput('Trailer Parking', 'trailer_parking_stalls')}
            {numInput('Car Parking', 'car_parking_stalls')}
          </div>

          <Separator className="bg-[#374151]" />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-[#9CA3AF]">Sprinkler System</Label>
              <Select
                value={scorecard.sprinkler_system ?? undefined}
                onValueChange={(val) => updateField('sprinkler_system', val as ScorecardType['sprinkler_system'])}
              >
                <SelectTrigger className="h-8 w-full border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="border-[#374151] bg-[#1F2937]">
                  <SelectItem value="ESFR">ESFR</SelectItem>
                  <SelectItem value="CMDA">CMDA</SelectItem>
                  <SelectItem value="Dry Pipe">Dry Pipe</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#9CA3AF]">Construction Type</Label>
              <Select
                value={scorecard.construction_type ?? undefined}
                onValueChange={(val) => updateField('construction_type', val as ScorecardType['construction_type'])}
              >
                <SelectTrigger className="h-8 w-full border-[#374151] bg-[#111827] text-[#F9FAFB] text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="border-[#374151] bg-[#1F2937]">
                  <SelectItem value="Tilt-up">Tilt-up</SelectItem>
                  <SelectItem value="Pre-eng. Steel">Pre-eng. Steel</SelectItem>
                  <SelectItem value="Masonry">Masonry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-[#374151]" />

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={scorecard.rail_access}
                onCheckedChange={(val) => updateField('rail_access', val as boolean)}
              />
              <Label className="text-xs text-[#9CA3AF]">Rail Access</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={scorecard.dock_levelers}
                onCheckedChange={(val) => updateField('dock_levelers', val as boolean)}
              />
              <Label className="text-xs text-[#9CA3AF]">Dock Levelers</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={scorecard.cross_dock}
                onCheckedChange={(val) => updateField('cross_dock', val as boolean)}
              />
              <Label className="text-xs text-[#9CA3AF]">Cross-dock</Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Scorecard'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
