'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useMapStore } from '@/store/mapStore';

export function useAutoSave(mapId: string | null) {
  const supabase = createClient();
  const { viewport, basemap } = useMapStore();
  const lastSavedRef = useRef<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(async () => {
    if (!mapId) return;

    const stateStr = JSON.stringify({ viewport, basemap });
    if (stateStr === lastSavedRef.current) return;

    lastSavedRef.current = stateStr;

    await supabase.from('maps').update({
      center_lng: viewport.center[0],
      center_lat: viewport.center[1],
      zoom: viewport.zoom,
      basemap,
    }).eq('id', mapId);
  }, [mapId, viewport, basemap, supabase]);

  useEffect(() => {
    timerRef.current = setInterval(save, 30000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save]);

  return { save };
}
