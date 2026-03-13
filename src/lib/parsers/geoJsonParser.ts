import Papa from 'papaparse';
import { kml } from '@tmcw/togeojson';

/**
 * Parse a CSV string into a GeoJSON FeatureCollection.
 * Automatically detects latitude and longitude columns by name.
 */
export function csvToGeoJson(csvString: string): GeoJSON.FeatureCollection {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const headers = result.meta.fields || [];

  // Detect lat/lng columns
  const latAliases = ['lat', 'latitude', 'y', 'lat_dd', 'point_y'];
  const lngAliases = ['lng', 'lon', 'longitude', 'long', 'x', 'lng_dd', 'point_x'];

  const latCol = headers.find((h) => latAliases.includes(h.toLowerCase().trim()));
  const lngCol = headers.find((h) => lngAliases.includes(h.toLowerCase().trim()));

  if (!latCol || !lngCol) {
    throw new Error(
      `Could not detect latitude/longitude columns. Found columns: ${headers.join(', ')}. ` +
      `Expected one of [${latAliases.join(', ')}] for latitude and [${lngAliases.join(', ')}] for longitude.`
    );
  }

  const features: GeoJSON.Feature[] = [];

  for (const row of result.data) {
    const lat = parseFloat(row[latCol]);
    const lng = parseFloat(row[lngCol]);

    if (isNaN(lat) || isNaN(lng)) continue;

    const properties: Record<string, unknown> = {};
    for (const key of headers) {
      if (key !== latCol && key !== lngCol) {
        const val = row[key];
        // Try to parse numbers
        const num = parseFloat(val);
        properties[key] = !isNaN(num) && val.trim() !== '' ? num : val;
      }
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties,
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Parse a KML string into a GeoJSON FeatureCollection.
 * Uses @tmcw/togeojson for proper KML parsing.
 */
export function kmlToGeoJson(kmlString: string): GeoJSON.FeatureCollection {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlString, 'text/xml');
  const converted = kml(doc);
  return converted as GeoJSON.FeatureCollection;
}

/**
 * Validate that a parsed object is a valid GeoJSON FeatureCollection.
 */
export function validateGeoJson(
  data: unknown
): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Input is not an object' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.type !== 'FeatureCollection') {
    return { valid: false, error: `Expected type "FeatureCollection", got "${obj.type}"` };
  }

  if (!Array.isArray(obj.features)) {
    return { valid: false, error: '"features" must be an array' };
  }

  for (let i = 0; i < obj.features.length; i++) {
    const feature = obj.features[i] as Record<string, unknown>;
    if (feature.type !== 'Feature') {
      return { valid: false, error: `Feature at index ${i} has invalid type "${feature.type}"` };
    }
    if (!feature.geometry && feature.geometry !== null) {
      return { valid: false, error: `Feature at index ${i} is missing geometry` };
    }
  }

  return { valid: true };
}
