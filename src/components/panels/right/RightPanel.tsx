'use client';

import { useUIStore } from '@/store/uiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import RightPanelHeader from './RightPanelHeader';
import ParcelDetailCard from './ParcelDetailCard';
import CompAnalytics from './CompAnalytics';
import NotesPanel from './NotesPanel';
import TagsPanel from './TagsPanel';
import FeasibilityPanel from './FeasibilityPanel';
import ZoningInfo from './ZoningInfo';

export default function RightPanel() {
  const { rightPanelContent } = useUIStore();

  return (
    <aside className="flex h-full w-[380px] min-w-[380px] flex-col border-l border-white/10 bg-[#0F1629]">
      <RightPanelHeader />
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {rightPanelContent === 'parcel' && <ParcelDetailCard />}
          {rightPanelContent === 'comps' && <CompAnalytics />}
          {rightPanelContent === 'notes' && <NotesPanel />}
          {rightPanelContent === 'tags' && <TagsPanel />}
          {rightPanelContent === 'feasibility' && <FeasibilityPanel />}
          {rightPanelContent === 'zoning' && <ZoningInfo />}
        </div>
      </ScrollArea>
    </aside>
  );
}
