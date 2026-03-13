'use client';

import { Map, FolderOpen, Search, Layers, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUIStore } from '@/store/uiStore';

const tabs = [
  { label: 'Maps', href: '/app/maps', icon: Map },
  { label: 'Collections', href: '/app/collections', icon: FolderOpen },
  { label: 'Search', href: '/app/parcels', icon: Search },
  { label: 'Layers', href: '/app/layers', icon: Layers },
  { label: 'Profile', href: '/app/settings', icon: UserCircle },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { isMobile } = useUIStore();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#374151] bg-[#111827] pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-all duration-200 ${
                isActive
                  ? 'text-[#F59E0B]'
                  : 'text-[#9CA3AF] active:text-[#F9FAFB]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
