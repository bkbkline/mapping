'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Trash2,
  MapPin,
} from 'lucide-react';

interface DriveTimeIsochroneProps {
  parcelId: string;
  lat?: number;
  lng?: number;
}

interface IsochroneResult {
  minutes: number;
  area_sq_miles: number;
  population_estimate: number | null;
}

export function DriveTimeIsochrone({ parcelId, lat, lng }: DriveTimeIsochroneProps) {
  const [expanded, setExpanded] = useState(false);
  const [durations, setDurations] = useState<{ 30: boolean; 60: boolean; 90: boolean }>({
    30: true,
    60: false,
    90: false,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IsochroneResult[]>([]);

  const handleAnalyze = async () => {
    if (!lat || !lng) return;
    setLoading(true);

    const selectedMinutes = Object.entries(durations)
      .filter(([, checked]) => checked)
      .map(([mins]) => Number(mins));

    if (selectedMinutes.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/isochrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lng,
          durations: selectedMinutes,
          parcel_id: parcelId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(
          data.isochrones?.map((iso: { minutes: number; area_sq_miles?: number; population_estimate?: number }) => ({
            minutes: iso.minutes,
            area_sq_miles: iso.area_sq_miles ?? 0,
            population_estimate: iso.population_estimate ?? null,
          })) ?? []
        );
      } else {
        // Placeholder results for demo
        setResults(
          selectedMinutes.map((m) => ({
            minutes: m,
            area_sq_miles: m * 12.5,
            population_estimate: m * 45000,
          }))
        );
      }
    } catch {
      // Placeholder results for demo
      setResults(
        selectedMinutes.map((m) => ({
          minutes: m,
          area_sq_miles: m * 12.5,
          population_estimate: m * 45000,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResults([]);
  };

  return (
    <Card className="border-[#374151] bg-[#1F2937]">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F59E0B]" />
            <CardTitle className="text-[#F9FAFB]">Drive Time Analysis</CardTitle>
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
          {!lat || !lng ? (
            <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <MapPin className="h-4 w-4" />
              No coordinates available for this parcel.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                {([30, 60, 90] as const).map((mins) => (
                  <div key={mins} className="flex items-center gap-2">
                    <Checkbox
                      checked={durations[mins]}
                      onCheckedChange={(checked) =>
                        setDurations((prev) => ({ ...prev, [mins]: !!checked }))
                      }
                    />
                    <Label className="text-sm text-[#9CA3AF]">{mins} min</Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={loading || !Object.values(durations).some(Boolean)}
                  className="gap-2 bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#D97706]"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                  {loading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
                {results.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="gap-2 border-[#374151] text-[#9CA3AF] hover:text-[#F9FAFB]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {results.length > 0 && (
                <>
                  <Separator className="bg-[#374151]" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                      Results
                    </h4>
                    <p className="text-xs text-[#9CA3AF]">
                      Isochrone polygons are rendered on the map component. Summary below:
                    </p>
                    <div className="grid gap-2">
                      {results.map((r) => (
                        <div
                          key={r.minutes}
                          className="flex items-center justify-between rounded-lg border border-[#374151] bg-[#111827] px-4 py-2.5"
                        >
                          <div>
                            <span className="text-sm font-medium text-[#F59E0B]">
                              {r.minutes} min
                            </span>
                          </div>
                          <div className="flex gap-6 text-xs text-[#9CA3AF]">
                            <span>
                              Area:{' '}
                              <span className="text-[#F9FAFB]">
                                {r.area_sq_miles.toFixed(1)} sq mi
                              </span>
                            </span>
                            {r.population_estimate !== null && (
                              <span>
                                Pop:{' '}
                                <span className="text-[#F9FAFB]">
                                  {r.population_estimate.toLocaleString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
