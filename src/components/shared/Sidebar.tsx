'use client';

import {
  LayoutDashboard,
  Map,
  FolderOpen,
  Building2,
  Layers,
  Download,
  Settings,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
  { label: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Maps', href: '/app/maps', icon: Map },
  { label: 'Collections', href: '/app/collections', icon: FolderOpen },
  { label: 'Parcels', href: '/app/parcels', icon: Building2 },
  { label: 'Layer Library', href: '/app/layers', icon: Layers },
  { label: 'Exports', href: '/app/exports', icon: Download },
  { label: 'Settings', href: '/app/settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { sidebarOpen, toggleSidebar, isMobile } = useUIStore();

  // Hidden on mobile -- MobileNav takes over
  if (isMobile) return null;

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-[#374151] bg-[#111827] transition-all duration-200 ${
        sidebarOpen ? 'w-60' : 'w-[60px]'
      }`}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-[#374151] px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]">
          <Map className="h-4 w-4 text-[#0A0E1A]" />
        </div>
        {sidebarOpen && (
          <span className="ml-3 text-base font-semibold text-[#F9FAFB] transition-opacity duration-200">
            Land Intel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={!sidebarOpen ? item.label : undefined}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-l-2 border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                      : 'border-l-2 border-transparent text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {sidebarOpen && (
                    <span className="ml-3 truncate transition-opacity duration-200">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t border-[#374151] px-3 py-3">
        <div className="flex items-center">
          <Avatar size="sm">
            {profile?.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? 'User'} />
            )}
            <AvatarFallback className="bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          {sidebarOpen && (
            <div className="ml-3 min-w-0 transition-opacity duration-200">
              <p className="truncate text-sm font-medium text-[#F9FAFB]">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="truncate text-xs text-[#9CA3AF]">
                {profile?.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-10 items-center justify-center border-t border-[#374151] text-[#9CA3AF] transition-all duration-200 hover:bg-[#1F2937] hover:text-[#F9FAFB]"
      >
        {sidebarOpen ? (
          <ChevronsLeft className="h-4 w-4" />
        ) : (
          <ChevronsRight className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
