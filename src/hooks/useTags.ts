'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Tag } from '@/types';

export function useTags() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (error) throw error;
      return data as Tag[];
    },
  });

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name, color: color || '#6B7280' })
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });

  return { tags: tagsQuery.data || [], loading: tagsQuery.isLoading, createTag, deleteTag };
}

export function useParcelTags(parcelId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['parcel-tags', parcelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcel_tags')
        .select('*, tag:tags(*)')
        .eq('parcel_id', parcelId);
      if (error) throw error;
      return data as Array<{ id: string; parcel_id: string; tag_id: string; tag: Tag }>;
    },
    enabled: !!parcelId,
  });

  const addTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('parcel_tags')
        .insert({ parcel_id: parcelId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parcel-tags', parcelId] }),
  });

  const removeTag = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase
        .from('parcel_tags')
        .delete()
        .eq('parcel_id', parcelId)
        .eq('tag_id', tagId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parcel-tags', parcelId] }),
  });

  return {
    parcelTags: query.data?.map((pt) => pt.tag) || [],
    loading: query.isLoading,
    addTag,
    removeTag,
  };
}
