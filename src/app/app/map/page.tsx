'use client';

import dynamic from 'next/dynamic';

const MainMapView = dynamic(
  () => import('@/components/map/MainMapView'),
  { ssr: false, loading: () => (
    <div style={{ width: '100%', height: '100%', background: '#0A0E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, border: '4px solid #374151', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading map...</p>
      </div>
    </div>
  )}
);

export default function MapPage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <MainMapView />
    </div>
  );
}
