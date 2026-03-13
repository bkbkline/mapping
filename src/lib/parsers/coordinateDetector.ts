/**
 * Detect and parse coordinates from various string formats.
 *
 * Supported formats:
 * - Decimal degrees: "34.05, -118.25" or "-118.25, 34.05"
 * - DMS: "34°3'N 118°15'W" or "34°3'0\"N 118°15'0\"W"
 *
 * Auto-detects lat/lng vs lng/lat order based on US bounding box:
 *   Latitude: ~24 to ~50
 *   Longitude: ~-125 to ~-66
 */

// US bounding box for auto-detection
const US_LAT_MIN = 24;
const US_LAT_MAX = 50;
const US_LNG_MIN = -125;
const US_LNG_MAX = -66;

export function detectCoordinates(input: string): { lat: number; lng: number } | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Try DMS format first
  const dmsResult = parseDMS(trimmed);
  if (dmsResult) return dmsResult;

  // Try decimal degrees
  const decimalResult = parseDecimalDegrees(trimmed);
  if (decimalResult) return decimalResult;

  return null;
}

function parseDMS(input: string): { lat: number; lng: number } | null {
  // Match patterns like: 34°3'N 118°15'W or 34°3'0"N 118°15'0"W
  const dmsPattern =
    /(\d+)[°]\s*(\d+)?[''′]?\s*(\d+(?:\.\d+)?)?[""″]?\s*([NSns])\s*[,\s]+(\d+)[°]\s*(\d+)?[''′]?\s*(\d+(?:\.\d+)?)?[""″]?\s*([EWew])/;

  const match = input.match(dmsPattern);
  if (!match) return null;

  const latDeg = parseFloat(match[1]);
  const latMin = parseFloat(match[2] || '0');
  const latSec = parseFloat(match[3] || '0');
  const latDir = match[4].toUpperCase();

  const lngDeg = parseFloat(match[5]);
  const lngMin = parseFloat(match[6] || '0');
  const lngSec = parseFloat(match[7] || '0');
  const lngDir = match[8].toUpperCase();

  let lat = latDeg + latMin / 60 + latSec / 3600;
  let lng = lngDeg + lngMin / 60 + lngSec / 3600;

  if (latDir === 'S') lat = -lat;
  if (lngDir === 'W') lng = -lng;

  if (!isValidLatLng(lat, lng)) return null;

  return { lat, lng };
}

function parseDecimalDegrees(input: string): { lat: number; lng: number } | null {
  // Match two numbers separated by comma and/or whitespace
  const pattern = /^(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)$/;
  const match = input.match(pattern);
  if (!match) return null;

  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);

  if (isNaN(a) || isNaN(b)) return null;

  // Auto-detect order based on US bounding box
  // If a looks like latitude and b looks like longitude
  if (isUSLatitude(a) && isUSLongitude(b)) {
    return { lat: a, lng: b };
  }

  // If b looks like latitude and a looks like longitude (lng, lat order)
  if (isUSLatitude(b) && isUSLongitude(a)) {
    return { lat: b, lng: a };
  }

  // If neither fits US bounds, try standard lat, lng order
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
    return { lat: a, lng: b };
  }

  // Try lng, lat order
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
    return { lat: b, lng: a };
  }

  return null;
}

function isUSLatitude(val: number): boolean {
  return val >= US_LAT_MIN && val <= US_LAT_MAX;
}

function isUSLongitude(val: number): boolean {
  return val >= US_LNG_MIN && val <= US_LNG_MAX;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}
