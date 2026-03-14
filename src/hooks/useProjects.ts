'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProjectStore } from '@/store/projectStore';
import type { Project, ProjectSite } from '@/types';

export function useProjects() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { setProjects, setProjectSites, setLoading } = useProjectStore();

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
      return data as Project[];
    },
  });

  const createProject = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Project> }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const fetchProjectSites = useCallback(async (projectId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_sites')
      .select('*, parcel:parcels(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) throw error;
    setProjectSites(data || []);
    return data as ProjectSite[];
  }, [supabase, setProjectSites, setLoading]);

  const addSiteToProject = useMutation({
    mutationFn: async ({ projectId, parcelId }: { projectId: string; parcelId: string }) => {
      const { data, error } = await supabase
        .from('project_sites')
        .insert({ project_id: projectId, parcel_id: parcelId })
        .select('*, parcel:parcels(*)')
        .single();
      if (error) throw error;
      return data as ProjectSite;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-sites', variables.projectId] });
    },
  });

  const removeSiteFromProject = useMutation({
    mutationFn: async (siteId: string) => {
      const { error } = await supabase.from('project_sites').delete().eq('id', siteId);
      if (error) throw error;
    },
  });

  const updateSiteStatus = useMutation({
    mutationFn: async ({ siteId, status }: { siteId: string; status: string }) => {
      const { data, error } = await supabase
        .from('project_sites')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', siteId)
        .select()
        .single();
      if (error) throw error;
      return data as ProjectSite;
    },
  });

  return {
    projects: projectsQuery.data || [],
    loading: projectsQuery.isLoading,
    createProject,
    updateProject,
    deleteProject,
    fetchProjectSites,
    addSiteToProject,
    removeSiteFromProject,
    updateSiteStatus,
  };
}
