import { create } from 'zustand';
import type { Project, ProjectSite } from '@/types';

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  projectSites: ProjectSite[];
  loading: boolean;

  setProjects: (projects: Project[]) => void;
  setActiveProjectId: (id: string | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  setProjectSites: (sites: ProjectSite[]) => void;
  addProjectSite: (site: ProjectSite) => void;
  removeProjectSite: (siteId: string) => void;
  updateProjectSite: (siteId: string, updates: Partial<ProjectSite>) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProjectId: null,
  projectSites: [],
  loading: false,

  setProjects: (projects) => set({ projects }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter((p) => p.id !== id),
    activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
  })),
  setProjectSites: (sites) => set({ projectSites: sites }),
  addProjectSite: (site) => set((state) => ({ projectSites: [...state.projectSites, site] })),
  removeProjectSite: (siteId) => set((state) => ({
    projectSites: state.projectSites.filter((s) => s.id !== siteId),
  })),
  updateProjectSite: (siteId, updates) => set((state) => ({
    projectSites: state.projectSites.map((s) => s.id === siteId ? { ...s, ...updates } : s),
  })),
  setLoading: (loading) => set({ loading }),
}));
