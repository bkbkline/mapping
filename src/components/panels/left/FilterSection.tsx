'use client';

import { useSearchStore } from '@/store/searchStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function FilterSection() {
  const { filters, setFilters, resetFilters } = useSearchStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="h-7 text-xs text-gray-400 hover:text-white"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Acreage Range */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Acreage</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minAcreage ?? ''}
            onChange={(e) => setFilters({ minAcreage: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxAcreage ?? ''}
            onChange={(e) => setFilters({ maxAcreage: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
        </div>
      </div>

      {/* Zoning */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Zoning Codes</Label>
        <Input
          placeholder="e.g. M-1, M-2, I-1..."
          value={filters.zoning?.join(', ') ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilters({
              zoning: val ? val.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
            });
          }}
          className="h-8 bg-white/5 border-white/10 text-white text-xs"
        />
      </div>

      {/* Flood Zone */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="flood"
          checked={filters.floodZone ?? false}
          onCheckedChange={(checked) => setFilters({ floodZone: checked === true ? true : undefined })}
        />
        <Label htmlFor="flood" className="text-xs text-gray-400 cursor-pointer">
          Show only parcels in flood zones
        </Label>
      </div>

      {/* Value Range */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Assessed Value ($)</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minValue ?? ''}
            onChange={(e) => setFilters({ minValue: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxValue ?? ''}
            onChange={(e) => setFilters({ maxValue: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
        </div>
      </div>

      {/* Owner */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Owner Name</Label>
        <Input
          placeholder="Search by owner..."
          value={filters.owner ?? ''}
          onChange={(e) => setFilters({ owner: e.target.value || undefined })}
          className="h-8 bg-white/5 border-white/10 text-white text-xs"
        />
      </div>

      {/* County / State */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-gray-400">County</Label>
          <Input
            placeholder="County"
            value={filters.county ?? ''}
            onChange={(e) => setFilters({ county: e.target.value || undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
        </div>
        <div className="w-20 space-y-1">
          <Label className="text-xs text-gray-400">State</Label>
          <Input
            placeholder="CA"
            maxLength={2}
            value={filters.state ?? ''}
            onChange={(e) => setFilters({ state: e.target.value.toUpperCase() || undefined })}
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
          />
        </div>
      </div>
    </div>
  );
}
