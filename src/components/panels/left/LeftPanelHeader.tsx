'use client';

import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Layers,
  FolderOpen,
  Bookmark,
  PanelLeftClose,
} from 'lucide-react';
import type { LeftPanelSection } from '@/types';

const sections: { id: LeftPanelSection; icon: React.ElementType; label: string }[] = [
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'filters', icon: Filter, label: 'Filters' },
  { id: 'layers', icon: Layers, label: 'Layers' },
  { id: 'projects', icon: FolderOpen, label: 'Projects' },
  { id: 'saved', icon: Bookmark, label: 'Saved' },
];

export default function LeftPanelHeader() {
  const { leftPanelSection, setLeftPanelSection, toggleLeftPanel } = useUIStore();

  return (
    <div className="border-b border-white/10 p-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-white tracking-wide">Land Intel</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLeftPanel}
          className="h-7 w-7 text-gray-400 hover:text-white"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-0.5">
        {sections.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelSection(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 h-auto py-1.5 px-1 text-[10px] ${
              leftPanelSection === id
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
