'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Comp } from '@/types';

interface CompAnalytics {
  count: number;
  avgPricePerSf: number | null;
  medianPricePerSf: number | null;
  avgPricePerAcre: number | null;
  medianPricePerAcre: number | null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function useComps() {
  const supabase = createClient();
  const [comps, setComps] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<CompAnalytics | null>(null);

  const fetchCompsByRadius = useCallback(async (lat: number, lng: number, radiusMiles: number = 3) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('comps_within_radius', {
        lat,
        lng,
        radius_miles: radiusMiles,
      });
      if (error) {
        // Fallback: just fetch all comps if RPC doesn't exist
        const { data: fallback } = await supabase
          .from('comps')
          .select('*')
          .order('sale_date', { ascending: false })
          .limit(50);
        const results = (fallback as Comp[]) || [];
        setComps(results);
        computeAnalytics(results);
        return results;
      }
      const results = (data as Comp[]) || [];
      setComps(results);
      computeAnalytics(results);
      return results;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCompsByParcel = useCallback(async (parcelId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comps')
        .select('*')
        .eq('parcel_id', parcelId)
        .order('sale_date', { ascending: false });
      if (error) throw error;
      const results = (data as Comp[]) || [];
      setComps(results);
      computeAnalytics(results);
      return results;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const computeAnalytics = (compsList: Comp[]) => {
    const psfValues = compsList.map((c) => c.price_per_sf).filter((v): v is number => v != null);
    const paValues = compsList.map((c) => c.price_per_acre).filter((v): v is number => v != null);

    setAnalytics({
      count: compsList.length,
      avgPricePerSf: psfValues.length ? psfValues.reduce((a, b) => a + b, 0) / psfValues.length : null,
      medianPricePerSf: median(psfValues),
      avgPricePerAcre: paValues.length ? paValues.reduce((a, b) => a + b, 0) / paValues.length : null,
      medianPricePerAcre: median(paValues),
    });
  };

  return { comps, loading, analytics, fetchCompsByRadius, fetchCompsByParcel };
}
