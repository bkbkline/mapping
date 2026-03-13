'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './useAuth';

interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  cursor: { lng: number; lat: number } | null;
}

interface RealtimeCallbacks {
  onPresenceSync?: (users: PresenceUser[]) => void;
  onCursorMove?: (userId: string, lng: number, lat: number) => void;
  onAnnotationChange?: (action: string, annotation: unknown) => void;
}

export function useRealtime(mapId: string | null, callbacks: RealtimeCallbacks = {}) {
  const supabase = createClient();
  const { user, profile } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const throttleRef = useRef<number>(0);

  useEffect(() => {
    if (!mapId || !user || !profile) return;

    const channel = supabase.channel(`map:${mapId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        callbacks.onPresenceSync?.(users);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        callbacks.onCursorMove?.(payload.user_id, payload.lng, payload.lat);
      })
      .on('broadcast', { event: 'annotation_change' }, ({ payload }) => {
        callbacks.onAnnotationChange?.(payload.action, payload.annotation);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            full_name: profile.full_name || 'Anonymous',
            avatar_url: profile.avatar_url,
            cursor: null,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [mapId, user, profile, supabase, callbacks]);

  const broadcastCursor = useCallback((lng: number, lat: number) => {
    const now = Date.now();
    if (now - throttleRef.current < 100) return;
    throttleRef.current = now;

    channelRef.current?.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { user_id: user?.id, lng, lat },
    });
  }, [user]);

  const broadcastAnnotationChange = useCallback((action: string, annotation: unknown) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'annotation_change',
      payload: { action, annotation },
    });
  }, []);

  return { broadcastCursor, broadcastAnnotationChange };
}
