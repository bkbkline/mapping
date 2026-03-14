'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/store/projectStore';
import { Plus, ChevronRight, FolderOpen, Trash2 } from 'lucide-react';
import type { ParcelStatus } from '@/types';

const statusColors: Record<ParcelStatus, string> = {
  prospect: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  under_contract: 'bg-yellow-500/20 text-yellow-400',
  closed: 'bg-gray-500/20 text-gray-400',
  rejected: 'bg-red-500/20 text-red-400',
  on_hold: 'bg-orange-500/20 text-orange-400',
};

export default function ProjectSection() {
  const { projects, loading, createProject, deleteProject, fetchProjectSites } = useProjects();
  const { activeProjectId, setActiveProjectId, projectSites } = useProjectStore();
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (activeProjectId) {
      fetchProjectSites(activeProjectId);
    }
  }, [activeProjectId, fetchProjectSites]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject.mutate({ name: newName.trim() });
    setNewName('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Projects</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-white"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showForm && (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Project name..."
            className="h-8 bg-white/5 border-white/10 text-white text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>
            Add
          </Button>
        </div>
      )}

      {loading && <p className="text-xs text-gray-500">Loading...</p>}

      <div className="space-y-1">
        {projects.map((project) => (
          <div key={project.id}>
            <button
              onClick={() => setActiveProjectId(activeProjectId === project.id ? null : project.id)}
              className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-colors ${
                activeProjectId === project.id ? 'bg-blue-600/20' : 'hover:bg-white/5'
              }`}
            >
              <FolderOpen
                className="h-4 w-4 shrink-0"
                style={{ color: project.color }}
              />
              <span className="text-sm text-white truncate flex-1">{project.name}</span>
              <ChevronRight
                className={`h-3.5 w-3.5 text-gray-500 transition-transform ${
                  activeProjectId === project.id ? 'rotate-90' : ''
                }`}
              />
            </button>

            {activeProjectId === project.id && (
              <div className="ml-6 mt-1 space-y-1">
                {projectSites.length === 0 && (
                  <p className="text-xs text-gray-500 py-1">No sites added yet</p>
                )}
                {projectSites.map((site) => (
                  <div key={site.id} className="flex items-center gap-2 py-1">
                    <span className="text-xs text-gray-300 truncate flex-1">
                      {site.parcel?.situs_address || site.parcel?.apn || 'Unknown parcel'}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] h-5 ${statusColors[site.status]}`}
                    >
                      {site.status}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-400 hover:text-red-300 w-full justify-start"
                  onClick={() => deleteProject.mutate(project.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete project
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
