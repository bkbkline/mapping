'use client';

import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { MobileNav } from '@/components/shared/MobileNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  // useAuth populates the auth store but we don't block rendering on it.
  // The middleware already ensures only authenticated users reach /app/* routes.
  useAuth();
  useResponsive();

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-[#0A0E1A]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </ErrorBoundary>
  );
}
