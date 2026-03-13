import { describe, it, expect } from 'vitest';
import { lookupZoning } from '@/lib/zoningLookup';
import type { ZoningLookupEntry } from '@/types';

const sampleTable: ZoningLookupEntry[] = [
  {
    code: 'M-2',
    description: 'Heavy Industrial',
    permitted_uses: ['Manufacturing', 'Warehousing', 'Distribution'],
    max_far: 0.6,
    max_lot_coverage: 0.65,
    min_setbacks: { front: 20, rear: 0, side: 0 },
    max_height: 75,
    industrial_compatibility: 'permitted',
  },
  {
    code: 'M-1',
    description: 'Light Industrial',
    permitted_uses: ['Light Manufacturing', 'Warehousing', 'Office'],
    max_far: 0.5,
    max_lot_coverage: 0.55,
    min_setbacks: { front: 25, rear: 10, side: 10 },
    max_height: 45,
    industrial_compatibility: 'permitted',
  },
  {
    code: 'C-2',
    description: 'General Commercial',
    permitted_uses: ['Retail', 'Office', 'Restaurant'],
    max_far: 3.0,
    max_lot_coverage: null,
    min_setbacks: null,
    max_height: 100,
    industrial_compatibility: 'not_permitted',
  },
];

describe('lookupZoning', () => {
  it('should find an exact match', () => {
    const result = lookupZoning('M-2', sampleTable);
    expect(result).not.toBeNull();
    expect(result!.code).toBe('M-2');
    expect(result!.description).toBe('Heavy Industrial');
  });

  it('should be case insensitive', () => {
    const result = lookupZoning('m-2', sampleTable);
    expect(result).not.toBeNull();
    expect(result!.code).toBe('M-2');
  });

  it('should handle mixed case', () => {
    const result = lookupZoning('c-2', sampleTable);
    expect(result).not.toBeNull();
    expect(result!.code).toBe('C-2');
  });

  it('should trim whitespace', () => {
    const result = lookupZoning('  M-1  ', sampleTable);
    expect(result).not.toBeNull();
    expect(result!.code).toBe('M-1');
  });

  it('should return null for missing codes', () => {
    const result = lookupZoning('R-1', sampleTable);
    expect(result).toBeNull();
  });

  it('should return null for empty code', () => {
    const result = lookupZoning('', sampleTable);
    expect(result).toBeNull();
  });

  it('should return null for empty table', () => {
    const result = lookupZoning('M-2', []);
    expect(result).toBeNull();
  });

  it('should return null for null-like inputs', () => {
    expect(lookupZoning(null as unknown as string, sampleTable)).toBeNull();
    expect(lookupZoning('M-2', null as unknown as ZoningLookupEntry[])).toBeNull();
  });

  it('should return the correct permitted uses', () => {
    const result = lookupZoning('M-2', sampleTable);
    expect(result!.permitted_uses).toContain('Warehousing');
    expect(result!.permitted_uses).toHaveLength(3);
  });

  it('should return correct industrial_compatibility', () => {
    expect(lookupZoning('M-2', sampleTable)!.industrial_compatibility).toBe('permitted');
    expect(lookupZoning('C-2', sampleTable)!.industrial_compatibility).toBe('not_permitted');
  });
});
