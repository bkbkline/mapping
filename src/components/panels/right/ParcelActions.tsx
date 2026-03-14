'use client';

import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/uiStore';
import { useProjects } from '@/hooks/useProjects';
import { useProjectStore } from '@/store/projectStore';
import {
  FolderPlus,
  StickyNote,
  Tag,
  Download,
  BarChart3,
  Building,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ParcelActions({ parcelId }: { parcelId: string }) {
  const { setRightPanelContent, openModal } = useUIStore();
  const { addSiteToProject } = useProjects();
  const { activeProjectId } = useProjectStore();

  const handleAddToProject = () => {
    if (!activeProjectId) {
      toast.error('Select a project first');
      return;
    }
    addSiteToProject.mutate({ projectId: activeProjectId, parcelId });
    toast.success('Added to project');
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton icon={FolderPlus} label="Save to Project" onClick={handleAddToProject} />
      <ActionButton icon={StickyNote} label="Notes" onClick={() => setRightPanelContent('notes')} />
      <ActionButton icon={Tag} label="Tags" onClick={() => setRightPanelContent('tags')} />
      <ActionButton icon={BarChart3} label="Comps" onClick={() => setRightPanelContent('comps')} />
      <ActionButton icon={Building} label="Feasibility" onClick={() => setRightPanelContent('feasibility')} />
      <ActionButton icon={Download} label="Export" onClick={() => openModal('export')} />
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="h-7 text-[11px] bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10"
    >
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Button>
  );
}
