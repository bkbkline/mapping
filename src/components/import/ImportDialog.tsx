'use client';

import { useState, useCallback } from 'react';
import { useImport } from '@/hooks/useImport';
import { useUIStore } from '@/store/uiStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImportDialog() {
  const { activeModal, closeModal } = useUIStore();
  const { importFile, importing, progress, error } = useImport();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ name: string; count: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  }, []);

  const handleImport = async () => {
    if (!file) return;
    const importResult = await importFile(file);
    if (importResult) {
      setResult({ name: importResult.dataset.name, count: importResult.featureCount });
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    closeModal();
  };

  const isOpen = activeModal === 'import';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-[#0F1629] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload CSV, GeoJSON, or KML files to add data to the map.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
            <p className="text-sm text-white font-medium">Import Complete</p>
            <p className="text-xs text-gray-400">
              {result.count} features imported from &ldquo;{result.name}&rdquo;
            </p>
            <Button onClick={handleClose} className="mt-2">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                {file ? file.name : 'Drop a file here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">CSV, GeoJSON, KML</p>
              <input
                id="file-input"
                type="file"
                accept=".csv,.geojson,.json,.kml"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* File info */}
            {file && (
              <div className="flex items-center gap-2 bg-white/5 rounded-md p-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400"
                  onClick={() => setFile(null)}
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Progress */}
            {importing && (
              <div className="space-y-1">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">Processing... {progress}%</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-md p-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} className="text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? 'Importing...' : 'Import'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
