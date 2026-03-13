'use client';

import { Suspense } from 'react';

// Internal render page used by Edge Functions for PDF export
// Renders map without chrome for headless capture
export default function RenderMapPage() {
  return (
    <Suspense fallback={<div>Loading map for export...</div>}>
      <div id="render-map" style={{ width: '100vw', height: '100vh' }}>
        {/* Map renders here for PDF capture */}
        <p className="text-white p-4">Map render endpoint for PDF export. This page is used by the export-pdf Edge Function.</p>
      </div>
    </Suspense>
  );
}
