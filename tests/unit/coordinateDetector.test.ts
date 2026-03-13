import { describe, it, expect } from 'vitest';
import { detectCoordinates } from '@/lib/parsers/coordinateDetector';

describe('detectCoordinates', () => {
  describe('decimal degrees - lat, lng order', () => {
    it('should parse "34.05, -118.25"', () => {
      const result = detectCoordinates('34.05, -118.25');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 5);
      expect(result!.lng).toBeCloseTo(-118.25, 5);
    });

    it('should parse "34.05 -118.25" (space separated)', () => {
      const result = detectCoordinates('34.05 -118.25');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 5);
      expect(result!.lng).toBeCloseTo(-118.25, 5);
    });
  });

  describe('decimal degrees - lng, lat order (auto-detect)', () => {
    it('should parse "-118.25, 34.05" and auto-detect order', () => {
      const result = detectCoordinates('-118.25, 34.05');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 5);
      expect(result!.lng).toBeCloseTo(-118.25, 5);
    });

    it('should parse "-118.25 34.05" and auto-detect order', () => {
      const result = detectCoordinates('-118.25 34.05');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 5);
      expect(result!.lng).toBeCloseTo(-118.25, 5);
    });
  });

  describe('DMS format', () => {
    it('should parse "34\u00b03\'N 118\u00b015\'W"', () => {
      const result = detectCoordinates("34\u00b03'N 118\u00b015'W");
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 2);
      expect(result!.lng).toBeCloseTo(-118.25, 2);
    });

    it('should parse DMS with seconds', () => {
      const result = detectCoordinates('34\u00b03\'0"N 118\u00b015\'0"W');
      expect(result).not.toBeNull();
      expect(result!.lat).toBeCloseTo(34.05, 2);
      expect(result!.lng).toBeCloseTo(-118.25, 2);
    });

    it('should handle southern and eastern hemispheres', () => {
      const result = detectCoordinates("33\u00b052'S 151\u00b012'E");
      expect(result).not.toBeNull();
      expect(result!.lat).toBeLessThan(0);
      expect(result!.lng).toBeGreaterThan(0);
    });
  });

  describe('invalid inputs', () => {
    it('should return null for empty string', () => {
      expect(detectCoordinates('')).toBeNull();
    });

    it('should return null for non-coordinate text', () => {
      expect(detectCoordinates('hello world')).toBeNull();
    });

    it('should return null for single number', () => {
      expect(detectCoordinates('34.05')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(detectCoordinates(null as unknown as string)).toBeNull();
      expect(detectCoordinates(undefined as unknown as string)).toBeNull();
    });

    it('should return null for out-of-range coordinates', () => {
      expect(detectCoordinates('200, 300')).toBeNull();
    });
  });
});
