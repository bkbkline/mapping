'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NewMapPage() {
  const router = useRouter();
  const supabase = createClient();
  const creatingRef = useRef(false);

  useEffect(() => {
    if (creatingRef.current) return;
    creatingRef.current = true;

    async function createMap() {
      // Get the current user directly from supabase session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        console.error('[NewMap] No session found, redirecting to login');
        router.push('/login');
        return;
      }

      const userId = session.user.id;

      // Get profile for org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', userId)
        .single();

      console.log('[NewMap] Creating map for user:', userId, 'org:', profile?.org_id);

      const { data, error } = await supabase
        .from('maps')
        .insert({
          owner_id: userId,
          org_id: profile?.org_id ?? null,
          title: 'Untitled Map',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[NewMap] Failed to create map:', error.message, error.details, error.hint);
        // Fallback: create via API route
        try {
          const res = await fetch('/api/maps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Untitled Map' }),
          });
          const result = await res.json();
          if (result.data?.id) {
            router.replace(`/app/maps/${result.data.id}`);
            return;
          }
        } catch (apiErr) {
          console.error('[NewMap] API fallback also failed:', apiErr);
        }
        router.push('/app/maps');
        return;
      }

      console.log('[NewMap] Map created:', data.id);
      router.replace(`/app/maps/${data.id}`);
    }

    createMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#374151] border-t-[#F59E0B]" />
        <p className="text-sm text-[#9CA3AF]">Creating new map...</p>
      </div>
    </div>
  );
}
