'use client';

import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const titles: Record<string, string> = {
  parcel: 'Parcel Detail',
  comps: 'Comparable Sales',
  notes: 'Notes',
  tags: 'Tags',
  feasibility: 'Feasibility Analysis',
  zoning: 'Zoning Information',
};

export default function RightPanelHeader() {
  const { rightPanelContent, closeRightPanel } = useUIStore();

  return (
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <h2 className="text-sm font-semibold text-white">
        {rightPanelContent ? titles[rightPanelContent] || 'Details' : 'Details'}
      </h2>
      <Button
        variant="ghost"
        size="icon"
        onClick={closeRightPanel}
        className="h-7 w-7 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
