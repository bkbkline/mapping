'use client';

import { useAuth } from '@/hooks/useAuth';
import { useResponsive } from '@/hooks/useResponsive';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { MobileNav } from '@/components/shared/MobileNav';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { Loader2 } from 'lucide-react';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  useResponsive();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0E1A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#F59E0B]" />
          <p className="text-sm text-[#9CA3AF]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-[#0A0E1A]">
        {/* Left sidebar (hidden on mobile) */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        <MobileNav />
      </div>
    </ErrorBoundary>
  );
}
