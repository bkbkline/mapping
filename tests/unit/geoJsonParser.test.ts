import { describe, it, expect } from 'vitest';
import { csvToGeoJson, validateGeoJson } from '@/lib/parsers/geoJsonParser';

describe('csvToGeoJson', () => {
  it('should parse CSV with lat/lng columns', () => {
    const csv = `name,lat,lng,value
Site A,34.05,-118.25,100
Site B,34.06,-118.24,200`;

    const result = csvToGeoJson(csv);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features).toHaveLength(2);
    expect(result.features[0].geometry.type).toBe('Point');
    expect((result.features[0].geometry as GeoJSON.Point).coordinates).toEqual([-118.25, 34.05]);
    expect(result.features[0].properties.name).toBe('Site A');
  });

  it('should parse CSV with latitude/longitude columns', () => {
    const csv = `id,latitude,longitude
1,34.05,-118.25
2,34.06,-118.24`;

    const result = csvToGeoJson(csv);
    expect(result.features).toHaveLength(2);
    expect((result.features[0].geometry as GeoJSON.Point).coordinates).toEqual([-118.25, 34.05]);
  });

  it('should parse CSV with x/y columns', () => {
    const csv = `id,y,x
1,34.05,-118.25`;

    const result = csvToGeoJson(csv);
    expect(result.features).toHaveLength(1);
    expect((result.features[0].geometry as GeoJSON.Point).coordinates).toEqual([-118.25, 34.05]);
  });

  it('should skip rows with invalid coordinates', () => {
    const csv = `name,lat,lng
Valid,34.05,-118.25
Invalid,abc,xyz
Also Valid,34.06,-118.24`;

    const result = csvToGeoJson(csv);
    expect(result.features).toHaveLength(2);
  });

  it('should throw when lat/lng columns are missing', () => {
    const csv = `name,address,value
Site A,123 Main St,100`;

    expect(() => csvToGeoJson(csv)).toThrow('Could not detect latitude/longitude columns');
  });

  it('should include non-coordinate columns as properties', () => {
    const csv = `name,lat,lng,zoning,acreage
Site A,34.05,-118.25,M-2,5.5`;

    const result = csvToGeoJson(csv);
    expect(result.features[0].properties.name).toBe('Site A');
    expect(result.features[0].properties.zoning).toBe('M-2');
    expect(result.features[0].properties.acreage).toBe(5.5);
  });

  it('should handle empty CSV', () => {
    const csv = `lat,lng`;
    const result = csvToGeoJson(csv);
    expect(result.features).toHaveLength(0);
  });
});

describe('validateGeoJson', () => {
  it('should validate a proper FeatureCollection', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [0, 0] },
          properties: {},
        },
      ],
    };
    expect(validateGeoJson(geojson)).toEqual({ valid: true });
  });

  it('should reject non-objects', () => {
    expect(validateGeoJson(null)).toEqual({ valid: false, error: 'Input is not an object' });
    expect(validateGeoJson('string')).toEqual({ valid: false, error: 'Input is not an object' });
    expect(validateGeoJson(42)).toEqual({ valid: false, error: 'Input is not an object' });
  });

  it('should reject wrong type', () => {
    const result = validateGeoJson({ type: 'Feature', geometry: null, properties: {} });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('FeatureCollection');
  });

  it('should reject missing features array', () => {
    const result = validateGeoJson({ type: 'FeatureCollection' });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('features');
  });

  it('should reject features with wrong type', () => {
    const result = validateGeoJson({
      type: 'FeatureCollection',
      features: [{ type: 'Wrong', geometry: null, properties: {} }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid type');
  });

  it('should accept features with null geometry', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', geometry: null, properties: {} }],
    };
    expect(validateGeoJson(geojson)).toEqual({ valid: true });
  });
});
