'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import LeftPanel from '@/components/panels/left/LeftPanel';
import RightPanel from '@/components/panels/right/RightPanel';
import MapCanvas from '@/components/map/MapCanvas';
import MapFloatingToolbar from '@/components/map/MapFloatingToolbar';
import { MapInstanceProvider } from '@/components/map/MapInstanceContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const { leftPanelOpen, rightPanelOpen, isMobile, setIsMobile, setIsTablet } = useUIStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile, setIsTablet]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0E1A]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <MapInstanceProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#0A0E1A]">
          <OfflineBanner />

          {/* Left Panel */}
          {leftPanelOpen && !isMobile && <LeftPanel />}

          {/* Center: Map */}
          <div className="relative flex-1 min-w-0">
            <MapCanvas />
            <MapFloatingToolbar />
          </div>

          {/* Right Panel */}
          {rightPanelOpen && <RightPanel />}

          {children}
        </div>
      </MapInstanceProvider>
    </ErrorBoundary>
  );
}
