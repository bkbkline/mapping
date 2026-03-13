import * as turf from '@turf/turf';

/**
 * Calculate the area of a polygon defined by coordinates in square feet.
 * Coordinates should be [lng, lat] pairs forming a closed ring.
 */
export function calculateArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;

  // Ensure the ring is closed
  const ring = [...coords];
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0]);
  }

  const polygon = turf.polygon([ring]);
  const areaSqMeters = turf.area(polygon);
  // Convert square meters to square feet
  return areaSqMeters * 10.7639;
}

/**
 * Calculate the distance along a line defined by coordinates in feet.
 * Coordinates should be [lng, lat] pairs.
 */
export function calculateDistance(coords: [number, number][]): number {
  if (coords.length < 2) return 0;

  const line = turf.lineString(coords);
  const distanceKm = turf.length(line, { units: 'kilometers' });
  // Convert km to feet
  return distanceKm * 3280.84;
}

/**
 * Convert square feet to acres.
 */
export function sqFtToAcres(sqft: number): number {
  return sqft / 43560;
}

/**
 * Convert feet to miles.
 */
export function feetToMiles(feet: number): number {
  return feet / 5280;
}

/**
 * Format a measurement value with the appropriate unit string.
 */
export function formatMeasurement(
  value: number,
  unit: 'sqft' | 'acres' | 'feet' | 'miles'
): string {
  switch (unit) {
    case 'sqft':
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} sq ft`;
    case 'acres':
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} acres`;
    case 'feet':
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} ft`;
    case 'miles':
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} mi`;
    default:
      return `${value}`;
  }
}
