/**
 * Pure structural validation for map `cellEntries` (links + simple objects).
 * Shared by server API validation and optionally client-side checks.
 */
import { parseGridCellId } from '../../grid/gridCellIds';
import { LOCATION_MAP_OBJECT_KIND_IDS } from './locationMap.constants';

const OBJECT_KIND_SET = new Set(LOCATION_MAP_OBJECT_KIND_IDS as readonly string[]);

export type LocationMapCellAuthoringValidationError = {
  path: string;
  code: string;
  message: string;
};

/** Structure validation for map-owned cell authoring (links + simple objects). */
export function validateCellEntriesStructure(
  cellEntries: unknown,
  width: number,
  height: number,
): LocationMapCellAuthoringValidationError[] {
  const errors: LocationMapCellAuthoringValidationError[] = [];
  if (cellEntries === undefined || cellEntries === null) return errors;
  if (!Array.isArray(cellEntries)) {
    return [{ path: 'cellEntries', code: 'INVALID', message: 'cellEntries must be an array' }];
  }

  const seenCellIds = new Set<string>();
  for (let i = 0; i < cellEntries.length; i++) {
    const prefix = `cellEntries[${i}]`;
    const e = cellEntries[i];
    if (!e || typeof e !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each cell entry must be an object' });
      continue;
    }
    const row = e as Record<string, unknown>;
    if (typeof row.cellId !== 'string' || row.cellId.trim() === '') {
      errors.push({ path: `${prefix}.cellId`, code: 'REQUIRED', message: 'cellId is required' });
      continue;
    }
    const cid = row.cellId.trim();
    if (seenCellIds.has(cid)) {
      errors.push({
        path: `${prefix}.cellId`,
        code: 'DUPLICATE',
        message: `Duplicate cellId "${cid}"`,
      });
      continue;
    }
    seenCellIds.add(cid);
    const p = parseGridCellId(cid);
    if (!p) {
      errors.push({
        path: `${prefix}.cellId`,
        code: 'INVALID',
        message: 'cellId must be a valid grid cell id (e.g. "0,0")',
      });
    } else if (p.x < 0 || p.y < 0 || p.x >= width || p.y >= height) {
      errors.push({
        path: `${prefix}.cellId`,
        code: 'OUT_OF_RANGE',
        message: `cellId must be within grid bounds (0..${width - 1}, 0..${height - 1})`,
      });
    }

    if (row.linkedLocationId !== undefined && row.linkedLocationId !== null) {
      if (typeof row.linkedLocationId !== 'string' || row.linkedLocationId.trim() === '') {
        errors.push({
          path: `${prefix}.linkedLocationId`,
          code: 'INVALID',
          message: 'linkedLocationId must be a non-empty string when set',
        });
      }
    }

    const objects = row.objects;
    if (objects !== undefined && objects !== null) {
      if (!Array.isArray(objects)) {
        errors.push({ path: `${prefix}.objects`, code: 'INVALID', message: 'objects must be an array' });
      } else {
        for (let j = 0; j < objects.length; j++) {
          const op = `${prefix}.objects[${j}]`;
          const o = objects[j];
          if (!o || typeof o !== 'object') {
            errors.push({ path: op, code: 'INVALID', message: 'Each object must be an object' });
            continue;
          }
          const oro = o as Record<string, unknown>;
          if (typeof oro.id !== 'string' || oro.id.trim() === '') {
            errors.push({ path: `${op}.id`, code: 'REQUIRED', message: 'object id is required' });
          }
          if (typeof oro.kind !== 'string' || !OBJECT_KIND_SET.has(oro.kind)) {
            errors.push({
              path: `${op}.kind`,
              code: 'INVALID',
              message: `kind must be one of: ${LOCATION_MAP_OBJECT_KIND_IDS.join(', ')}`,
            });
          }
          if (oro.label !== undefined && oro.label !== null && typeof oro.label !== 'string') {
            errors.push({ path: `${op}.label`, code: 'INVALID', message: 'label must be a string' });
          }
        }
      }
    }
  }
  return errors;
}
