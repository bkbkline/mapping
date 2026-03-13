import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileName = file.name.toLowerCase();
    const fileContent = await file.text();
    let geojson: GeoJSON.FeatureCollection;

    // Parse based on file type
    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
      geojson = parseGeoJSON(fileContent);
    } else if (fileName.endsWith('.kml')) {
      geojson = parseKML(fileContent);
    } else if (fileName.endsWith('.csv')) {
      geojson = parseCSV(fileContent);
    } else if (fileName.endsWith('.gpx')) {
      geojson = parseGPX(fileContent);
    } else if (fileName.endsWith('.zip')) {
      // Shapefile ZIP handling would require binary parsing with shpjs
      // For now, return an error suggesting client-side processing
      return new Response(
        JSON.stringify({ error: 'Shapefile ZIP uploads should be processed client-side with shpjs' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported file type: ${fileName.split('.').pop()}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate bounding box from features
    const bbox = calculateBBox(geojson);

    // Upload the normalized GeoJSON to storage
    const storagePath = `layers/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.geojson`;
    const encoder = new TextEncoder();

    const { error: uploadError } = await supabase.storage
      .from('layer-files')
      .upload(storagePath, encoder.encode(JSON.stringify(geojson)), {
        contentType: 'application/geo+json',
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('layer-files')
      .createSignedUrl(storagePath, 86400); // 24h

    if (signedUrlError) throw new Error(`Signed URL failed: ${signedUrlError.message}`);

    return new Response(
      JSON.stringify({
        data: {
          file_url: signedUrlData!.signedUrl,
          feature_count: geojson.features.length,
          bbox,
          storage_path: storagePath,
        },
        error: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ data: null, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ---- Parsers ----

function parseGeoJSON(content: string): GeoJSON.FeatureCollection {
  const parsed = JSON.parse(content);

  if (parsed.type === 'FeatureCollection') {
    return parsed;
  }

  if (parsed.type === 'Feature') {
    return { type: 'FeatureCollection', features: [parsed] };
  }

  // Bare geometry
  if (['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'].includes(parsed.type)) {
    return {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: parsed, properties: {} }],
    };
  }

  throw new Error('Invalid GeoJSON: unrecognized type');
}

function parseKML(content: string): GeoJSON.FeatureCollection {
  // Minimal KML to GeoJSON parser for Deno edge function
  // Extracts Placemark elements with Point, LineString, or Polygon coordinates
  const features: GeoJSON.Feature[] = [];

  const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
  let match;

  while ((match = placemarkRegex.exec(content)) !== null) {
    const block = match[1];

    // Extract name
    const nameMatch = block.match(/<name>([\s\S]*?)<\/name>/i);
    const name = nameMatch ? nameMatch[1].trim() : null;

    // Extract coordinates
    const coordsMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
    if (!coordsMatch) continue;

    const coordStr = coordsMatch[1].trim();
    const coords = coordStr.split(/\s+/).map((c) => {
      const [lng, lat, alt] = c.split(',').map(Number);
      return alt ? [lng, lat, alt] : [lng, lat];
    }).filter((c) => !isNaN(c[0]) && !isNaN(c[1]));

    if (coords.length === 0) continue;

    let geometry: GeoJSON.Geometry;
    if (coords.length === 1) {
      geometry = { type: 'Point', coordinates: coords[0] };
    } else if (block.includes('<Polygon>')) {
      geometry = { type: 'Polygon', coordinates: [coords] };
    } else {
      geometry = { type: 'LineString', coordinates: coords };
    }

    features.push({
      type: 'Feature',
      geometry,
      properties: { name },
    });
  }

  return { type: 'FeatureCollection', features };
}

function parseCSV(content: string): GeoJSON.FeatureCollection {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Detect lat/lng columns
  const latAliases = ['lat', 'latitude', 'y'];
  const lngAliases = ['lng', 'lon', 'longitude', 'long', 'x'];

  const latIdx = headers.findIndex((h) => latAliases.includes(h));
  const lngIdx = headers.findIndex((h) => lngAliases.includes(h));

  if (latIdx === -1 || lngIdx === -1) {
    throw new Error('CSV must have latitude and longitude columns');
  }

  const features: GeoJSON.Feature[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const lat = parseFloat(values[latIdx]);
    const lng = parseFloat(values[lngIdx]);

    if (isNaN(lat) || isNaN(lng)) continue;

    const properties: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (idx !== latIdx && idx !== lngIdx) {
        properties[h] = values[idx] || '';
      }
    });

    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties,
    });
  }

  return { type: 'FeatureCollection', features };
}

function parseGPX(content: string): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  // Parse waypoints
  const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"[\s\S]*?<\/wpt>/gi;
  let wptMatch;
  while ((wptMatch = wptRegex.exec(content)) !== null) {
    const lat = parseFloat(wptMatch[1]);
    const lng = parseFloat(wptMatch[2]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const nameMatch = wptMatch[0].match(/<name>([\s\S]*?)<\/name>/i);
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { name: nameMatch ? nameMatch[1].trim() : null },
    });
  }

  // Parse tracks
  const trksegRegex = /<trkseg>([\s\S]*?)<\/trkseg>/gi;
  let trkMatch;
  while ((trkMatch = trksegRegex.exec(content)) !== null) {
    const trkptRegex = /lat="([^"]+)"\s+lon="([^"]+)"/g;
    const coords: number[][] = [];
    let ptMatch;
    while ((ptMatch = trkptRegex.exec(trkMatch[1])) !== null) {
      const lat = parseFloat(ptMatch[1]);
      const lng = parseFloat(ptMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) coords.push([lng, lat]);
    }
    if (coords.length > 1) {
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {},
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

function calculateBBox(geojson: GeoJSON.FeatureCollection): [number, number, number, number] | null {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  let hasCoords = false;

  function processCoords(coords: unknown) {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number') {
      // It's a coordinate pair [lng, lat]
      hasCoords = true;
      minLng = Math.min(minLng, coords[0] as number);
      maxLng = Math.max(maxLng, coords[0] as number);
      minLat = Math.min(minLat, coords[1] as number);
      maxLat = Math.max(maxLat, coords[1] as number);
    } else {
      for (const item of coords) processCoords(item);
    }
  }

  for (const feature of geojson.features) {
    if (feature.geometry && 'coordinates' in feature.geometry) {
      processCoords(feature.geometry.coordinates);
    }
  }

  return hasCoords ? [minLng, minLat, maxLng, maxLat] : null;
}

// GeoJSON type declarations for Deno
declare namespace GeoJSON {
  interface FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
  }
  interface Feature {
    type: 'Feature';
    geometry: Geometry;
    properties: Record<string, unknown>;
  }
  type Geometry = Point | LineString | Polygon | MultiPoint | MultiLineString | MultiPolygon;
  interface Point { type: 'Point'; coordinates: number[]; }
  interface LineString { type: 'LineString'; coordinates: number[][]; }
  interface Polygon { type: 'Polygon'; coordinates: number[][]; }
  interface MultiPoint { type: 'MultiPoint'; coordinates: number[][]; }
  interface MultiLineString { type: 'MultiLineString'; coordinates: number[][][]; }
  interface MultiPolygon { type: 'MultiPolygon'; coordinates: number[][][][]; }
}
