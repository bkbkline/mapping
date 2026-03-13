import { create } from 'zustand';

type ModalType =
  | 'addLayer'
  | 'share'
  | 'export'
  | 'layerStyle'
  | 'newCollection'
  | 'newMap'
  | null;

interface UIStore {
  sidebarOpen: boolean;
  layerPanelOpen: boolean;
  inspectorOpen: boolean;
  activeModal: ModalType;
  isMobile: boolean;
  isTablet: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleLayerPanel: () => void;
  setLayerPanelOpen: (open: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setIsMobile: (isMobile: boolean) => void;
  setIsTablet: (isTablet: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  layerPanelOpen: false,
  inspectorOpen: false,
  activeModal: null,
  isMobile: false,
  isTablet: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleLayerPanel: () => set((state) => ({ layerPanelOpen: !state.layerPanelOpen })),
  setLayerPanelOpen: (open) => set({ layerPanelOpen: open }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setIsTablet: (isTablet) => set({ isTablet }),
}));
