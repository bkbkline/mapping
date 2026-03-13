'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const MapWorkspace = dynamic(() => import('@/components/map/MapWorkspace'), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

function MapLoadingSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0A0E1A]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#374151] border-t-[#F59E0B]" />
        <div className="text-sm text-[#9CA3AF]">Loading map workspace...</div>
      </div>
      {/* Skeleton layout hints */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header skeleton */}
        <div className="h-14 w-full bg-[#111827] border-b border-[#374151]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded bg-[#1F2937] animate-pulse" />
            <div className="h-5 w-48 rounded bg-[#1F2937] animate-pulse" />
          </div>
        </div>
        {/* Map area skeleton */}
        <div className="flex-1 bg-[#0A0E1A]" />
      </div>
    </div>
  );
}

export default function MapWorkspacePage() {
  const params = useParams();
  const mapId = params.mapId as string;

  return (
    <Suspense fallback={<MapLoadingSkeleton />}>
      <div className="h-full w-full overflow-hidden bg-[#0A0E1A]">
        <MapWorkspace mapId={mapId} />
      </div>
    </Suspense>
  );
}
