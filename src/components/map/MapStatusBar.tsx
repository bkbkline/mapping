'use client';

interface MapStatusBarProps {
  coordinates: { lng: number; lat: number; zoom: number };
}

export default function MapStatusBar({ coordinates }: MapStatusBarProps) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, zIndex: 10,
      background: 'rgba(15, 20, 40, 0.85)', backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(55, 65, 81, 0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace',
    }}>
      <span>Lat: {coordinates.lat} | Lng: {coordinates.lng}</span>
      <span>Zoom: {coordinates.zoom}</span>
    </div>
  );
}
