'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Note } from '@/types';

export function useNotes(parcelId?: string, projectId?: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const queryKey = ['notes', parcelId, projectId].filter(Boolean);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase.from('notes').select('*').order('created_at', { ascending: false });
      if (parcelId) q = q.eq('parcel_id', parcelId);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!(parcelId || projectId),
  });

  const createNote = useMutation({
    mutationFn: async (note: { content: string; parcel_id?: string; project_id?: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    notes: query.data || [],
    loading: query.isLoading,
    createNote,
    updateNote,
    deleteNote,
  };
}
