'use client';

import { useState } from 'react';
import { useExport } from '@/hooks/useExport';
import { useUIStore } from '@/store/uiStore';
import { useSearchStore } from '@/store/searchStore';
import { useMapInstance } from '@/components/map/MapInstanceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, Image, FileType } from 'lucide-react';

type ExportFormat = 'csv' | 'geojson' | 'png' | 'pdf';

const formats: { id: ExportFormat; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'csv', label: 'CSV', icon: FileText, description: 'Spreadsheet-compatible parcel data' },
  { id: 'geojson', label: 'GeoJSON', icon: FileDown, description: 'Geospatial data with geometry' },
  { id: 'png', label: 'PNG Screenshot', icon: Image, description: 'Current map view as image' },
  { id: 'pdf', label: 'PDF Map', icon: FileType, description: 'Printable map document' },
];

export default function ExportDialog() {
  const { activeModal, closeModal } = useUIStore();
  const { searchResults } = useSearchStore();
  const { containerRef } = useMapInstance();
  const { exportCSV, exportGeoJSON, exportPNG, exportPDF, exporting } = useExport();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  const isOpen = activeModal === 'export';

  const handleExport = async () => {
    switch (selectedFormat) {
      case 'csv':
        exportCSV(searchResults);
        break;
      case 'geojson':
        exportGeoJSON(searchResults);
        break;
      case 'png':
        if (containerRef.current) await exportPNG(containerRef.current);
        break;
      case 'pdf':
        if (containerRef.current) await exportPDF(containerRef.current);
        break;
    }
    closeModal();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="bg-[#0F1629] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a format to export your data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {formats.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setSelectedFormat(id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                selectedFormat === id
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Icon className={`h-5 w-5 ${selectedFormat === id ? 'text-blue-400' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm text-white font-medium">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {(selectedFormat === 'csv' || selectedFormat === 'geojson') && (
          <p className="text-xs text-gray-500">
            {searchResults.length} parcels will be exported.
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="ghost" onClick={closeModal} className="text-gray-400">
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
