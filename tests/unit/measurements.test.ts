import { describe, it, expect } from 'vitest';
import {
  calculateArea,
  calculateDistance,
  sqFtToAcres,
  feetToMiles,
  formatMeasurement,
} from '@/lib/calculations/measurements';

describe('calculateArea', () => {
  it('should return 0 for fewer than 3 coordinates', () => {
    expect(calculateArea([])).toBe(0);
    expect(calculateArea([[0, 0]])).toBe(0);
    expect(calculateArea([[0, 0], [1, 1]])).toBe(0);
  });

  it('should calculate area for a simple polygon', () => {
    // A roughly 1-acre rectangle near downtown LA
    // Approximately 208.7ft x 208.7ft = ~43,560 sq ft = 1 acre
    const coords: [number, number][] = [
      [-118.25, 34.05],
      [-118.2494, 34.05],
      [-118.2494, 34.0506],
      [-118.25, 34.0506],
    ];
    const area = calculateArea(coords);
    // Area should be a positive number in square feet
    expect(area).toBeGreaterThan(0);
  });

  it('should auto-close an open ring', () => {
    const coords: [number, number][] = [
      [-118.25, 34.05],
      [-118.249, 34.05],
      [-118.249, 34.051],
      [-118.25, 34.051],
    ];
    const area = calculateArea(coords);
    expect(area).toBeGreaterThan(0);
  });

  it('should handle already closed rings', () => {
    const coords: [number, number][] = [
      [-118.25, 34.05],
      [-118.249, 34.05],
      [-118.249, 34.051],
      [-118.25, 34.051],
      [-118.25, 34.05],
    ];
    const area = calculateArea(coords);
    expect(area).toBeGreaterThan(0);
  });
});

describe('calculateDistance', () => {
  it('should return 0 for fewer than 2 coordinates', () => {
    expect(calculateDistance([])).toBe(0);
    expect(calculateDistance([[-118.25, 34.05]])).toBe(0);
  });

  it('should calculate distance between two points', () => {
    // ~1 mile apart along a line in LA
    const coords: [number, number][] = [
      [-118.25, 34.05],
      [-118.25, 34.0645], // ~1 mile north
    ];
    const distance = calculateDistance(coords);
    // Should be roughly 5280 ft (1 mile)
    expect(distance).toBeGreaterThan(4500);
    expect(distance).toBeLessThan(6000);
  });

  it('should calculate distance along a multi-segment line', () => {
    const coords: [number, number][] = [
      [-118.25, 34.05],
      [-118.25, 34.055],
      [-118.245, 34.055],
    ];
    const distance = calculateDistance(coords);
    expect(distance).toBeGreaterThan(0);
  });
});

describe('sqFtToAcres', () => {
  it('should convert square feet to acres', () => {
    expect(sqFtToAcres(43560)).toBeCloseTo(1, 5);
    expect(sqFtToAcres(0)).toBe(0);
    expect(sqFtToAcres(87120)).toBeCloseTo(2, 5);
  });
});

describe('feetToMiles', () => {
  it('should convert feet to miles', () => {
    expect(feetToMiles(5280)).toBeCloseTo(1, 5);
    expect(feetToMiles(0)).toBe(0);
    expect(feetToMiles(2640)).toBeCloseTo(0.5, 5);
  });
});

describe('formatMeasurement', () => {
  it('should format square feet', () => {
    expect(formatMeasurement(43560, 'sqft')).toBe('43,560 sq ft');
  });

  it('should format acres with 2 decimal places', () => {
    expect(formatMeasurement(1.5, 'acres')).toBe('1.5 acres');
  });

  it('should format feet', () => {
    expect(formatMeasurement(1000, 'feet')).toBe('1,000 ft');
  });

  it('should format miles with 2 decimal places', () => {
    expect(formatMeasurement(2.75, 'miles')).toBe('2.75 mi');
  });
});
