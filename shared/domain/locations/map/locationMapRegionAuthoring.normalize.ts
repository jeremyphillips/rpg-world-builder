import {
  LOCATION_MAP_DEFAULT_REGION_NAME,
  LOCATION_MAP_REGION_COLOR_KEYS,
} from './locationMapRegion.constants';
import type { LocationMapRegionColorKey } from './locationMapRegion.constants';
import type { LocationMapRegionAuthoringEntry } from './locationMap.types';

const COLOR_KEY_SET = new Set<string>(LOCATION_MAP_REGION_COLOR_KEYS as readonly string[]);

/**
 * Normalize one region row from persistence or API (legacy `label` → `name`).
 */
export function normalizeRegionAuthoringEntry(raw: unknown): LocationMapRegionAuthoringEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== 'string' || row.id.trim() === '') {
    return null;
  }
  const id = row.id.trim();
  let colorKey = row.colorKey;
  if (typeof colorKey !== 'string' || !COLOR_KEY_SET.has(colorKey)) {
    colorKey = LOCATION_MAP_REGION_COLOR_KEYS[0];
  }
  const nameFrom = row.name ?? row.label;
  const name =
    typeof nameFrom === 'string' && nameFrom.trim().length > 0
      ? nameFrom.trim()
      : LOCATION_MAP_DEFAULT_REGION_NAME;
  let description: string | undefined;
  if (typeof row.description === 'string' && row.description.trim() !== '') {
    description = row.description.trim();
  }
  const entry: LocationMapRegionAuthoringEntry = {
    id,
    colorKey: colorKey as LocationMapRegionColorKey,
    name,
  };
  if (description !== undefined) {
    entry.description = description;
  }
  return entry;
}

/** Normalize a regionEntries array from persistence or API. */
export function normalizeRegionEntriesArray(input: unknown): LocationMapRegionAuthoringEntry[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const out: LocationMapRegionAuthoringEntry[] = [];
  for (const x of input) {
    const r = normalizeRegionAuthoringEntry(x);
    if (r) {
      out.push(r);
    }
  }
  return out;
}
