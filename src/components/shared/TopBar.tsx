'use client';

import { Search, Bell, Menu, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function TopBar() {
  const { profile, signOut } = useAuth();
  const { isMobile, toggleSidebar } = useUIStore();

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-[#374151] bg-[#111827] px-4">
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="mr-3 rounded-md p-1.5 text-[#9CA3AF] transition-all duration-200 hover:bg-[#1F2937] hover:text-[#F9FAFB]"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Centered search bar */}
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-[480px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            type="text"
            placeholder="Search parcels, addresses, APNs..."
            className="h-9 w-full rounded-lg border-[#374151] bg-[#1F2937] pl-9 pr-3 text-sm text-[#F9FAFB] placeholder:text-[#9CA3AF] focus-visible:border-[#F59E0B] focus-visible:ring-[#F59E0B]/20"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative rounded-md p-2 text-[#9CA3AF] transition-all duration-200 hover:bg-[#1F2937] hover:text-[#F9FAFB]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#F59E0B]" />
        </button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]/50">
            <Avatar size="default" className="cursor-pointer">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? 'User'} />
              )}
              <AvatarFallback className="bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-48 border-[#374151] bg-[#1F2937]">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-[#F9FAFB]">
                {profile?.full_name ?? 'User'}
              </p>
              <p className="text-xs text-[#9CA3AF]">{profile?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-[#374151]" />
            <DropdownMenuItem className="text-[#F9FAFB] focus:bg-[#374151] focus:text-[#F9FAFB]">
              <Link href="/app/settings" className="flex w-full items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#F9FAFB] focus:bg-[#374151] focus:text-[#F9FAFB]">
              <Link href="/app/settings" className="flex w-full items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#374151]" />
            <DropdownMenuItem
              className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
