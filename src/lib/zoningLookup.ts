import type { ZoningLookupEntry } from '@/types';

/**
 * Look up a zoning entry by code from a zoning lookup table.
 * Case-insensitive matching with trimmed input.
 *
 * @param code - The zoning code to look up (e.g., "M-2", "C-1")
 * @param table - Array of zoning lookup entries to search
 * @returns The matching entry or null if not found
 */
export function lookupZoning(
  code: string,
  table: ZoningLookupEntry[]
): ZoningLookupEntry | null {
  if (!code || !table || table.length === 0) return null;

  const normalizedCode = code.trim().toUpperCase();

  const entry = table.find(
    (e) => e.code.trim().toUpperCase() === normalizedCode
  );

  return entry || null;
}
