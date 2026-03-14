'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

export function useResponsive() {
  const { setIsMobile, setIsTablet, setLeftPanelOpen, isMobile, isTablet } = useUIStore();

  useEffect(() => {
    const checkSize = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      const tablet = w >= 768 && w < 1200;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile || tablet) setLeftPanelOpen(false);
    };

    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, [setIsMobile, setIsTablet, setLeftPanelOpen]);

  return { isMobile, isTablet };
}
