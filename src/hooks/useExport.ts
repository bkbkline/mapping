'use client';

import { useState, useCallback } from 'react';
import type { Parcel } from '@/types';

export function useExport() {
  const [exporting, setExporting] = useState(false);

  const exportCSV = useCallback((parcels: Parcel[], filename: string = 'parcels') => {
    const headers = ['APN', 'Address', 'Owner', 'Acreage', 'Zoning', 'Assessed Value', 'County', 'State'];
    const rows = parcels.map((p) => [
      p.apn || '',
      p.situs_address || '',
      p.owner_name || '',
      p.acreage?.toString() || '',
      p.zoning || '',
      p.assessed_value?.toString() || '',
      p.county || '',
      p.state_abbr || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    downloadBlob(csv, `${filename}.csv`, 'text/csv');
  }, []);

  const exportGeoJSON = useCallback((parcels: Parcel[], filename: string = 'parcels') => {
    const fc: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: parcels
        .filter((p) => p.geometry)
        .map((p) => ({
          type: 'Feature' as const,
          geometry: p.geometry!,
          properties: {
            id: p.id,
            apn: p.apn,
            address: p.situs_address,
            owner: p.owner_name,
            acreage: p.acreage,
            zoning: p.zoning,
            assessed_value: p.assessed_value,
          },
        })),
    };
    const json = JSON.stringify(fc, null, 2);
    downloadBlob(json, `${filename}.geojson`, 'application/json');
  }, []);

  const exportPNG = useCallback(async (mapContainer: HTMLElement, filename: string = 'map') => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(mapContainer, { useCORS: true });
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, `${filename}.png`, 'image/png');
      });
    } finally {
      setExporting(false);
    }
  }, []);

  const exportPDF = useCallback(async (mapContainer: HTMLElement, filename: string = 'map') => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(mapContainer, { useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'letter');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${filename}.pdf`);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportCSV, exportGeoJSON, exportPNG, exportPDF, exporting };
}

function downloadBlob(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
