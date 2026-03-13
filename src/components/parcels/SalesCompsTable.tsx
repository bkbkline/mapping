'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  FileSpreadsheet,
  BarChart3,
} from 'lucide-react';
import type { SalesComp } from '@/types';

interface SalesCompsTableProps {
  parcelId: string;
  initialComps?: SalesComp[];
  onCompsChange?: (comps: SalesComp[]) => void;
}

function createEmptyComp(): SalesComp {
  return {
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
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatCurrency(val: number): string {
  if (!val) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
}

export function SalesCompsTable({
  parcelId,
  initialComps = [],
  onCompsChange,
}: SalesCompsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [comps, setComps] = useState<SalesComp[]>(initialComps);

  const updateComps = (newComps: SalesComp[]) => {
    setComps(newComps);
    onCompsChange?.(newComps);
  };

  const addRow = () => {
    updateComps([...comps, createEmptyComp()]);
  };

  const deleteRow = (id: string) => {
    updateComps(comps.filter((c) => c.id !== id));
  };

  const updateCell = (id: string, key: keyof SalesComp, value: string | number) => {
    updateComps(
      comps.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [key]: value };
        // Recalculate derived fields
        if (key === 'sale_price' || key === 'building_sf') {
          updated.price_psf =
            updated.building_sf > 0 ? updated.sale_price / updated.building_sf : 0;
        }
        if (key === 'sale_price' || key === 'land_sf') {
          const acres = updated.land_sf / 43560;
          updated.land_price_per_acre = acres > 0 ? updated.sale_price / acres : 0;
        }
        return updated;
      })
    );
  };

  const stats = useMemo(() => {
    if (comps.length === 0) return null;
    const prices = comps.filter((c) => c.sale_price > 0).map((c) => c.sale_price);
    const psf = comps.filter((c) => c.price_psf > 0).map((c) => c.price_psf);
    const landPa = comps.filter((c) => c.land_price_per_acre > 0).map((c) => c.land_price_per_acre);

    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

    return {
      avgPrice: avg(prices),
      medPrice: median(prices),
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      avgPsf: avg(psf),
      medPsf: median(psf),
      minPsf: psf.length ? Math.min(...psf) : 0,
      maxPsf: psf.length ? Math.max(...psf) : 0,
      avgLandPa: avg(landPa),
      medLandPa: median(landPa),
      minLandPa: landPa.length ? Math.min(...landPa) : 0,
      maxLandPa: landPa.length ? Math.max(...landPa) : 0,
    };
  }, [comps]);

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const wsData = comps.map((c) => ({
        Address: c.address,
        'Sale Date': c.sale_date,
        'Sale Price': c.sale_price,
        'Building SF': c.building_sf,
        'Land SF (ac)': (c.land_sf / 43560).toFixed(2),
        '$/SF': c.price_psf.toFixed(2),
        'Land $/Ac': c.land_price_per_acre.toFixed(2),
        Zoning: c.zoning,
        'Clear Height': c.clear_height,
        Notes: c.notes,
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Comps');
      XLSX.writeFile(wb, `sales-comps-${parcelId}.xlsx`);
    } catch {
      // xlsx not available
      console.warn('xlsx library not available for export');
    }
  };

  const cellClass =
    'h-7 min-w-[80px] border-[#374151] bg-transparent text-[#F9FAFB] text-xs px-1.5';

  return (
    <Card className="border-[#374151] bg-[#1F2937]">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#F59E0B]" />
            <CardTitle className="text-[#F9FAFB]">Sales Comps</CardTitle>
            {comps.length > 0 && (
              <span className="rounded-full bg-[#F59E0B]/20 px-2 py-0.5 text-xs text-[#F59E0B]">
                {comps.length}
              </span>
            )}
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#374151]">
                  {[
                    'Address',
                    'Sale Date',
                    'Sale Price',
                    'Bldg SF',
                    'Land SF (ac)',
                    '$/SF',
                    'Land $/Ac',
                    'Zoning',
                    'Clear Ht',
                    'Notes',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-1.5 py-2 text-left text-xs font-medium text-[#9CA3AF]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comps.map((comp) => (
                  <tr key={comp.id} className="border-b border-[#374151]/50">
                    <td>
                      <Input
                        value={comp.address}
                        onChange={(e) => updateCell(comp.id, 'address', e.target.value)}
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Input
                        type="date"
                        value={comp.sale_date}
                        onChange={(e) => updateCell(comp.id, 'sale_date', e.target.value)}
                        className={`${cellClass} min-w-[120px]`}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={comp.sale_price || ''}
                        onChange={(e) =>
                          updateCell(comp.id, 'sale_price', Number(e.target.value) || 0)
                        }
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={comp.building_sf || ''}
                        onChange={(e) =>
                          updateCell(comp.id, 'building_sf', Number(e.target.value) || 0)
                        }
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={comp.land_sf || ''}
                        onChange={(e) =>
                          updateCell(comp.id, 'land_sf', Number(e.target.value) || 0)
                        }
                        className={cellClass}
                      />
                    </td>
                    <td className="px-1.5 text-[#9CA3AF]">
                      {comp.price_psf > 0 ? `$${comp.price_psf.toFixed(2)}` : '--'}
                    </td>
                    <td className="px-1.5 text-[#9CA3AF]">
                      {comp.land_price_per_acre > 0
                        ? formatCurrency(comp.land_price_per_acre)
                        : '--'}
                    </td>
                    <td>
                      <Input
                        value={comp.zoning}
                        onChange={(e) => updateCell(comp.id, 'zoning', e.target.value)}
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={comp.clear_height || ''}
                        onChange={(e) =>
                          updateCell(comp.id, 'clear_height', Number(e.target.value) || 0)
                        }
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Input
                        value={comp.notes}
                        onChange={(e) => updateCell(comp.id, 'notes', e.target.value)}
                        className={cellClass}
                      />
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteRow(comp.id)}
                        className="text-[#9CA3AF] hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary stats */}
          {stats && comps.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#374151] bg-[#111827] p-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#374151]">
                    <th className="px-2 py-1 text-left text-[#9CA3AF]">Stat</th>
                    <th className="px-2 py-1 text-right text-[#9CA3AF]">Sale Price</th>
                    <th className="px-2 py-1 text-right text-[#9CA3AF]">$/SF</th>
                    <th className="px-2 py-1 text-right text-[#9CA3AF]">Land $/Ac</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1 text-[#9CA3AF]">Average</td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.avgPrice)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      ${stats.avgPsf.toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.avgLandPa)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-[#9CA3AF]">Median</td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.medPrice)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      ${stats.medPsf.toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.medLandPa)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-[#9CA3AF]">Min</td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.minPrice)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      ${stats.minPsf.toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.minLandPa)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-1 text-[#9CA3AF]">Max</td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.maxPrice)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      ${stats.maxPsf.toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-right text-[#F9FAFB]">
                      {formatCurrency(stats.maxLandPa)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
              onClick={addRow}
            >
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
              onClick={handleExportExcel}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
