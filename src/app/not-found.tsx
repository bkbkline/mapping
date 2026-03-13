'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0E1A] px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#1F2937] p-6">
            <MapPin className="h-12 w-12 text-[#F59E0B]" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-[#F9FAFB]">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-[#F9FAFB]">Page not found</h2>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/app/dashboard" className="mt-6 inline-block">
          <Button className="bg-[#F59E0B] text-[#0A0E1A] hover:bg-[#F59E0B]/90">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
