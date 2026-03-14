'use client';

import { useUIStore } from '@/store/uiStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import LeftPanelHeader from './LeftPanelHeader';
import SearchSection from './SearchSection';
import FilterSection from './FilterSection';
import LayerSection from './LayerSection';
import ProjectSection from './ProjectSection';
import SavedSection from './SavedSection';

export default function LeftPanel() {
  const { leftPanelSection } = useUIStore();

  return (
    <aside className="flex h-full w-[320px] min-w-[320px] flex-col border-r border-white/10 bg-[#0F1629]">
      <LeftPanelHeader />
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {leftPanelSection === 'search' && <SearchSection />}
          {leftPanelSection === 'filters' && <FilterSection />}
          {leftPanelSection === 'layers' && <LayerSection />}
          {leftPanelSection === 'projects' && <ProjectSection />}
          {leftPanelSection === 'saved' && <SavedSection />}
        </div>
      </ScrollArea>
    </aside>
  );
}
