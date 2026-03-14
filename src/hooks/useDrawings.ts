'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Drawing } from '@/types';

export function useDrawings(projectId?: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['drawings', projectId],
    queryFn: async () => {
      let q = supabase.from('drawings').select('*').order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Drawing[];
    },
  });

  const saveDrawing = useMutation({
    mutationFn: async (drawing: Partial<Drawing>) => {
      const { data, error } = await supabase
        .from('drawings')
        .insert(drawing)
        .select()
        .single();
      if (error) throw error;
      return data as Drawing;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drawings'] }),
  });

  const updateDrawing = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Drawing> }) => {
      const { data, error } = await supabase
        .from('drawings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Drawing;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drawings'] }),
  });

  const deleteDrawing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drawings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drawings'] }),
  });

  return {
    drawings: query.data || [],
    loading: query.isLoading,
    saveDrawing,
    updateDrawing,
    deleteDrawing,
  };
}
