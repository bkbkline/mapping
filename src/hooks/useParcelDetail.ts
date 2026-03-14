'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Parcel } from '@/types';

export function useParcelDetail() {
  const supabase = createClient();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchParcel = useCallback(async (parcelId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', parcelId)
        .single();
      if (error) throw error;
      setParcel(data as Parcel);
      return data as Parcel;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchParcelByApn = useCallback(async (apn: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('apn', apn)
        .single();
      if (error) throw error;
      setParcel(data as Parcel);
      return data as Parcel;
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const clearParcel = useCallback(() => {
    setParcel(null);
  }, []);

  return { parcel, loading, fetchParcel, fetchParcelByApn, clearParcel };
}
