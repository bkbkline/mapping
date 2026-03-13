'use client';

import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import type { DrawTool } from '@/types';

const TOOL_SHORTCUTS: Record<string, DrawTool> = {
  v: 'pan',
  Escape: 'pan',
  p: 'polygon',
  r: 'rectangle',
  c: 'circle',
  l: 'line',
  m: 'point',
  d: 'measure_distance',
  a: 'measure_area',
  b: 'buffer',
};

export function useKeyboardShortcuts() {
  const { setActiveTool, undo, redo, deleteAnnotation, selectedFeatureId } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Delete selected
      if (e.key === 'Delete' && selectedFeatureId) {
        deleteAnnotation(selectedFeatureId);
        return;
      }

      // Tool shortcuts
      const tool = TOOL_SHORTCUTS[e.key];
      if (tool) {
        setActiveTool(tool);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool, undo, redo, deleteAnnotation, selectedFeatureId]);
}
