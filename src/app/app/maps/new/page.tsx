'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function NewMapPage() {
  const router = useRouter();
  const { user, org } = useAuth();
  const supabase = createClient();
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!user || creatingRef.current) return;
    creatingRef.current = true;

    async function createMap() {
      const { data, error } = await supabase
        .from('maps')
        .insert({
          owner_id: user!.id,
          org_id: org?.id ?? null,
          title: 'Untitled Map',
          description: null,
          center_lng: -98.5,
          center_lat: 39.8,
          zoom: 4,
          basemap: 'satellite-streets-v12',
          share_mode: 'private',
          is_archived: false,
          tags: [],
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create map:', error);
        router.push('/app/maps');
        return;
      }

      router.replace(`/app/maps/${data.id}`);
    }

    createMap();
  }, [user, org, supabase, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#374151] border-t-[#F59E0B]" />
        <p className="text-sm text-[#9CA3AF]">Creating new map...</p>
      </div>
    </div>
  );
}
