'use client';

import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import {
  PanelLeftOpen,
  Map as MapIcon,
  Pencil,
  Ruler,
  Camera,
  Download,
  Upload,
} from 'lucide-react';
import BasemapSwitcher from './BasemapSwitcher';
import DrawTools from './DrawTools';
import MeasureTools from './MeasureTools';
import { useState } from 'react';

export default function MapFloatingToolbar() {
  const { leftPanelOpen, toggleLeftPanel, openModal } = useUIStore();
  const [showBasemap, setShowBasemap] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);

  return (
    <>
      {/* Left panel toggle (only when collapsed) */}
      {!leftPanelOpen && (
        <div className="absolute top-3 left-3 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleLeftPanel}
            className="h-9 w-9 bg-[#1A1F36] border border-white/10 text-white hover:bg-white/10 shadow-lg"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main toolbar */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <ToolbarButton
          icon={MapIcon}
          label="Basemap"
          active={showBasemap}
          onClick={() => { setShowBasemap(!showBasemap); setShowDraw(false); setShowMeasure(false); }}
        />
        <ToolbarButton
          icon={Pencil}
          label="Draw"
          active={showDraw}
          onClick={() => { setShowDraw(!showDraw); setShowBasemap(false); setShowMeasure(false); }}
        />
        <ToolbarButton
          icon={Ruler}
          label="Measure"
          active={showMeasure}
          onClick={() => { setShowMeasure(!showMeasure); setShowBasemap(false); setShowDraw(false); }}
        />
        <div className="h-px bg-white/10 my-0.5" />
        <ToolbarButton icon={Camera} label="Screenshot" onClick={() => openModal('export')} />
        <ToolbarButton icon={Upload} label="Import" onClick={() => openModal('import')} />
        <ToolbarButton icon={Download} label="Export" onClick={() => openModal('export')} />
      </div>

      {/* Flyout panels */}
      {showBasemap && (
        <div className="absolute top-3 right-14 z-10">
          <BasemapSwitcher onClose={() => setShowBasemap(false)} />
        </div>
      )}
      {showDraw && (
        <div className="absolute top-[52px] right-14 z-10">
          <DrawTools onClose={() => setShowDraw(false)} />
        </div>
      )}
      {showMeasure && (
        <div className="absolute top-[92px] right-14 z-10">
          <MeasureTools onClose={() => setShowMeasure(false)} />
        </div>
      )}
    </>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      title={label}
      className={`h-9 w-9 shadow-lg border border-white/10 ${
        active
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-[#1A1F36] text-gray-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
