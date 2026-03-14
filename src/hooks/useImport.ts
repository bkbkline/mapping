'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ImportedDataset } from '@/types';

interface ImportResult {
  dataset: ImportedDataset;
  featureCount: number;
}

export function useImport() {
  const supabase = createClient();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const importFile = useCallback(async (file: File): Promise<ImportResult | null> => {
    setImporting(true);
    setProgress(0);
    setError(null);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let geojson: GeoJSON.FeatureCollection | null = null;
      let fileType: 'csv' | 'geojson' | 'kml' | 'shapefile' = 'geojson';

      if (ext === 'geojson' || ext === 'json') {
        const text = await file.text();
        geojson = JSON.parse(text) as GeoJSON.FeatureCollection;
        fileType = 'geojson';
      } else if (ext === 'csv') {
        const Papa = (await import('papaparse')).default;
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const features: GeoJSON.Feature[] = [];
        for (const row of parsed.data as Record<string, string>[]) {
          const lat = parseFloat(row.latitude || row.lat || row.y || '');
          const lng = parseFloat(row.longitude || row.lng || row.lon || row.x || '');
          if (!isNaN(lat) && !isNaN(lng)) {
            features.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [lng, lat] },
              properties: row,
            });
          }
        }
        geojson = { type: 'FeatureCollection', features };
        fileType = 'csv';
      } else if (ext === 'kml') {
        const { kml: parseKml } = await import('@tmcw/togeojson');
        const text = await file.text();
        const dom = new DOMParser().parseFromString(text, 'text/xml');
        geojson = parseKml(dom) as GeoJSON.FeatureCollection;
        fileType = 'kml';
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      setProgress(50);

      if (!geojson || !geojson.features?.length) {
        throw new Error('No features found in file');
      }

      const geometryType = geojson.features[0]?.geometry?.type || null;

      const { data, error: dbError } = await supabase
        .from('imported_datasets')
        .insert({
          name: file.name.replace(/\.[^.]+$/, ''),
          file_type: fileType,
          feature_count: geojson.features.length,
          geometry_type: geometryType,
          geojson: geojson as unknown as Record<string, unknown>,
          original_filename: file.name,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setProgress(100);

      return {
        dataset: data as ImportedDataset,
        featureCount: geojson.features.length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      return null;
    } finally {
      setImporting(false);
    }
  }, [supabase]);

  return { importFile, importing, progress, error };
}
