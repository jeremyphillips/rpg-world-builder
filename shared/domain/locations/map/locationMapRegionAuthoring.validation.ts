import { LOCATION_MAP_REGION_COLOR_KEYS } from './locationMapRegion.constants';
import type { LocationMapRegionAuthoringEntry } from './locationMap.types';

export type RegionRefValidationError = {
  path: string;
  code: string;
  message: string;
};

const COLOR_KEY_SET = new Set<string>(LOCATION_MAP_REGION_COLOR_KEYS as readonly string[]);

export type LocationMapRegionAuthoringValidationError = {
  path: string;
  code: string;
  message: string;
};

export function validateRegionEntriesStructure(
  regionEntries: unknown,
): LocationMapRegionAuthoringValidationError[] {
  const errors: LocationMapRegionAuthoringValidationError[] = [];
  if (regionEntries === undefined || regionEntries === null) {
    return errors;
  }
  if (!Array.isArray(regionEntries)) {
    return [{ path: 'regionEntries', code: 'INVALID', message: 'regionEntries must be an array' }];
  }
  const seenIds = new Set<string>();
  for (let i = 0; i < regionEntries.length; i++) {
    const prefix = `regionEntries[${i}]`;
    const e = regionEntries[i];
    if (!e || typeof e !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each region entry must be an object' });
      continue;
    }
    const row = e as Record<string, unknown>;
    if (typeof row.id !== 'string' || row.id.trim() === '') {
      errors.push({ path: `${prefix}.id`, code: 'REQUIRED', message: 'region id is required' });
      continue;
    }
    const id = row.id.trim();
    if (seenIds.has(id)) {
      errors.push({
        path: `${prefix}.id`,
        code: 'DUPLICATE',
        message: `Duplicate region id "${id}"`,
      });
      continue;
    }
    seenIds.add(id);
    if (typeof row.colorKey !== 'string' || !COLOR_KEY_SET.has(row.colorKey)) {
      errors.push({
        path: `${prefix}.colorKey`,
        code: 'INVALID',
        message: `colorKey must be one of: ${LOCATION_MAP_REGION_COLOR_KEYS.join(', ')}`,
      });
    }
    if (row.name !== undefined && row.name !== null && typeof row.name !== 'string') {
      errors.push({ path: `${prefix}.name`, code: 'INVALID', message: 'name must be a string' });
    }
    if (row.label !== undefined && row.label !== null && typeof row.label !== 'string') {
      errors.push({ path: `${prefix}.label`, code: 'INVALID', message: 'label must be a string' });
    }
    if (row.description !== undefined && row.description !== null && typeof row.description !== 'string') {
      errors.push({
        path: `${prefix}.description`,
        code: 'INVALID',
        message: 'description must be a string',
      });
    }
  }
  return errors;
}

/** Drop region entries not referenced by any cell (keeps payload tidy). */
export function pruneOrphanRegionEntries(
  regionEntries: LocationMapRegionAuthoringEntry[],
  referencedRegionIds: ReadonlySet<string>,
): LocationMapRegionAuthoringEntry[] {
  return regionEntries.filter((r) => referencedRegionIds.has(r.id.trim()));
}

/**
 * Each cell `regionId` must match a `regionEntries` id when both are present.
 */
export function validateCellRegionIdsReferenceRegionEntries(
  cellEntries: unknown,
  regionEntries: readonly LocationMapRegionAuthoringEntry[],
): RegionRefValidationError[] {
  const errors: RegionRefValidationError[] = [];
  const ids = new Set(regionEntries.map((r) => r.id.trim()));
  if (!Array.isArray(cellEntries)) {
    return errors;
  }
  for (let i = 0; i < cellEntries.length; i++) {
    const e = cellEntries[i];
    if (!e || typeof e !== 'object') continue;
    const row = e as Record<string, unknown>;
    const rid = row.regionId;
    if (rid === undefined || rid === null) continue;
    if (typeof rid !== 'string' || rid.trim() === '') continue;
    const t = rid.trim();
    if (!ids.has(t)) {
      errors.push({
        path: `cellEntries[${i}].regionId`,
        code: 'INVALID',
        message: `regionId "${t}" has no matching regionEntries entry`,
      });
    }
  }
  return errors;
}
