import { create } from 'zustand';
import type { LeftPanelSection, RightPanelContent } from '@/types';

type ModalType =
  | 'addLayer'
  | 'share'
  | 'export'
  | 'import'
  | 'layerStyle'
  | 'newCollection'
  | 'newMap'
  | null;

interface UIStore {
  // Three-panel layout state
  leftPanelOpen: boolean;
  leftPanelSection: LeftPanelSection;
  rightPanelOpen: boolean;
  rightPanelContent: RightPanelContent;

  // Legacy compatibility
  activeModal: ModalType;
  isMobile: boolean;
  isTablet: boolean;

  // Left panel
  toggleLeftPanel: () => void;
  setLeftPanelOpen: (open: boolean) => void;
  setLeftPanelSection: (section: LeftPanelSection) => void;

  // Right panel
  openRightPanel: (content: RightPanelContent) => void;
  closeRightPanel: () => void;
  setRightPanelContent: (content: RightPanelContent) => void;

  // Modals
  openModal: (modal: ModalType) => void;
  closeModal: () => void;

  // Responsive
  setIsMobile: (isMobile: boolean) => void;
  setIsTablet: (isTablet: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  leftPanelOpen: true,
  leftPanelSection: 'search',
  rightPanelOpen: false,
  rightPanelContent: null,
  activeModal: null,
  isMobile: false,
  isTablet: false,

  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  setLeftPanelSection: (section) => set({ leftPanelSection: section, leftPanelOpen: true }),

  openRightPanel: (content) => set({ rightPanelOpen: true, rightPanelContent: content }),
  closeRightPanel: () => set({ rightPanelOpen: false, rightPanelContent: null }),
  setRightPanelContent: (content) => set({ rightPanelContent: content }),

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setIsTablet: (isTablet) => set({ isTablet }),
}));
