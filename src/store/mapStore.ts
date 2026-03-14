import { create } from 'zustand';
import type { DrawTool, DrawingMode, MapLayer, Annotation, MapViewport } from '@/types';

interface UndoAction {
  type: string;
  payload: unknown;
  inverse: unknown;
}

interface MapStore {
  activeMapId: string | null;
  mapLoaded: boolean;
  viewport: MapViewport;
  activeTool: DrawTool;
  selectedFeatureId: string | null;
  selectedFeatureType: 'annotation' | 'parcel' | 'layer_feature' | null;
  layers: MapLayer[];
  annotations: Annotation[];
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  basemap: string;
  selectedParcelIds: string[];
  hoveredParcelId: string | null;
  drawingMode: DrawingMode;

  setActiveMapId: (id: string | null) => void;
  setMapLoaded: (loaded: boolean) => void;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setActiveTool: (tool: DrawTool) => void;
  setBasemap: (basemap: string) => void;
  addLayer: (layer: MapLayer) => void;
  updateLayer: (layerId: string, updates: Partial<MapLayer>) => void;
  removeLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  reorderLayers: (layerId: string, newIndex: number) => void;
  setOpacity: (layerId: string, opacity: number) => void;
  setLayers: (layers: MapLayer[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  setAnnotations: (annotations: Annotation[]) => void;
  undo: () => void;
  redo: () => void;
  selectFeature: (id: string | null, type: 'annotation' | 'parcel' | 'layer_feature' | null) => void;
  clearSelection: () => void;
  setSelectedParcelIds: (ids: string[]) => void;
  toggleParcelSelection: (id: string) => void;
  setHoveredParcelId: (id: string | null) => void;
  setDrawingMode: (mode: DrawingMode) => void;
}

const MAX_UNDO = 20;

export const useMapStore = create<MapStore>((set) => ({
  activeMapId: null,
  mapLoaded: false,
  viewport: { center: [-98.5, 39.8], zoom: 4, bearing: 0, pitch: 0 },
  activeTool: 'pan',
  selectedFeatureId: null,
  selectedFeatureType: null,
  layers: [],
  annotations: [],
  undoStack: [],
  redoStack: [],
  basemap: 'satellite-streets-v12',
  selectedParcelIds: [],
  hoveredParcelId: null,
  drawingMode: null,

  setActiveMapId: (id) => set({ activeMapId: id }),
  setMapLoaded: (loaded) => set({ mapLoaded: loaded }),
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport },
  })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setBasemap: (basemap) => set({ basemap }),

  addLayer: (layer) => set((state) => ({
    layers: [...state.layers, layer],
    undoStack: [...state.undoStack, { type: 'addLayer', payload: layer, inverse: layer.id }].slice(-MAX_UNDO),
    redoStack: [],
  })),

  updateLayer: (layerId, updates) => set((state) => ({
    layers: state.layers.map((l) => l.id === layerId ? { ...l, ...updates } : l),
  })),

  removeLayer: (layerId) => set((state) => ({
    layers: state.layers.filter((l) => l.id !== layerId),
  })),

  toggleLayerVisibility: (layerId) => set((state) => ({
    layers: state.layers.map((l) =>
      l.id === layerId ? { ...l, is_visible: !l.is_visible } : l
    ),
  })),

  reorderLayers: (layerId, newIndex) => set((state) => {
    const layers = [...state.layers];
    const oldIndex = layers.findIndex((l) => l.id === layerId);
    if (oldIndex === -1) return state;
    const [moved] = layers.splice(oldIndex, 1);
    layers.splice(newIndex, 0, moved);
    return {
      layers: layers.map((l, i) => ({ ...l, sort_order: i })),
    };
  }),

  setOpacity: (layerId, opacity) => set((state) => ({
    layers: state.layers.map((l) =>
      l.id === layerId ? { ...l, opacity } : l
    ),
  })),

  setLayers: (layers) => set({ layers }),

  addAnnotation: (annotation) => set((state) => ({
    annotations: [...state.annotations, annotation],
    undoStack: [...state.undoStack, { type: 'addAnnotation', payload: annotation, inverse: annotation.id }].slice(-MAX_UNDO),
    redoStack: [],
  })),

  updateAnnotation: (id, updates) => set((state) => ({
    annotations: state.annotations.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),

  deleteAnnotation: (id) => set((state) => ({
    annotations: state.annotations.map((a) =>
      a.id === id ? { ...a, is_deleted: true } : a
    ),
  })),

  setAnnotations: (annotations) => set({ annotations }),

  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const action = state.undoStack[state.undoStack.length - 1];
    return {
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, action],
    };
  }),

  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    const action = state.redoStack[state.redoStack.length - 1];
    return {
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, action],
    };
  }),

  selectFeature: (id, type) => set({ selectedFeatureId: id, selectedFeatureType: type }),
  clearSelection: () => set({ selectedFeatureId: null, selectedFeatureType: null }),
  setSelectedParcelIds: (ids) => set({ selectedParcelIds: ids }),
  toggleParcelSelection: (id) => set((state) => ({
    selectedParcelIds: state.selectedParcelIds.includes(id)
      ? state.selectedParcelIds.filter((pid) => pid !== id)
      : [...state.selectedParcelIds, id],
  })),
  setHoveredParcelId: (id) => set({ hoveredParcelId: id }),
  setDrawingMode: (mode) => set({ drawingMode: mode }),
}));
