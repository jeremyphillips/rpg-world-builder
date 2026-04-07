/**
 * Pure structural validation for map `cellEntries` (links + simple objects).
 * Shared by server API validation and optionally client-side checks.
 */
import { parseGridCellId } from '../../grid/gridCellIds';
import {
  AUTHORED_CELL_FILL_DEFINITIONS,
  LOCATION_CELL_FILL_FAMILY_IDS,
  type LocationCellFillFamilyId,
} from './authoredCellFillDefinitions';
import { LOCATION_MAP_OBJECT_KIND_IDS } from './locationMap.constants';
import { LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS } from './locationMapStairEndpoint.types';

const OBJECT_KIND_SET = new Set<string>(LOCATION_MAP_OBJECT_KIND_IDS as readonly string[]);
const STAIR_DIRECTION_SET = new Set<string>(LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS as readonly string[]);
const CELL_FILL_FAMILY_SET = new Set<string>(LOCATION_CELL_FILL_FAMILY_IDS as readonly string[]);

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

    if (row.cellFillKind !== undefined && row.cellFillKind !== null) {
      errors.push({
        path: `${prefix}.cellFillKind`,
        code: 'INVALID',
        message: 'cellFillKind is no longer supported; use cellFill: { familyId, variantId }',
      });
    }

    if (row.cellFill !== undefined && row.cellFill !== null) {
      if (typeof row.cellFill !== 'object' || Array.isArray(row.cellFill)) {
        errors.push({
          path: `${prefix}.cellFill`,
          code: 'INVALID',
          message: 'cellFill must be an object with familyId and variantId when set',
        });
      } else {
        const cf = row.cellFill as Record<string, unknown>;
        const fid = cf.familyId;
        const vid = cf.variantId;
        if (typeof fid !== 'string' || !CELL_FILL_FAMILY_SET.has(fid)) {
          errors.push({
            path: `${prefix}.cellFill.familyId`,
            code: 'INVALID',
            message: `cellFill.familyId must be one of: ${LOCATION_CELL_FILL_FAMILY_IDS.join(', ')}`,
          });
        } else if (typeof vid !== 'string' || vid.trim() === '') {
          errors.push({
            path: `${prefix}.cellFill.variantId`,
            code: 'INVALID',
            message: 'cellFill.variantId must be a non-empty string when set',
          });
        } else {
          const fam = AUTHORED_CELL_FILL_DEFINITIONS[fid as LocationCellFillFamilyId];
          if (!(vid in fam.variants)) {
            errors.push({
              path: `${prefix}.cellFill.variantId`,
              code: 'INVALID',
              message: 'cellFill.variantId is not a valid key for this familyId',
            });
          }
        }
      }
    }

    if (row.regionId !== undefined && row.regionId !== null) {
      if (typeof row.regionId !== 'string' || row.regionId.trim() === '') {
        errors.push({
          path: `${prefix}.regionId`,
          code: 'INVALID',
          message: 'regionId must be a non-empty string when set',
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
          if (oro.authoredPlaceKindId !== undefined && oro.authoredPlaceKindId !== null) {
            if (typeof oro.authoredPlaceKindId !== 'string' || oro.authoredPlaceKindId.trim() === '') {
              errors.push({
                path: `${op}.authoredPlaceKindId`,
                code: 'INVALID',
                message: 'authoredPlaceKindId must be a non-empty string when set',
              });
            }
          }

          const kindStr = typeof oro.kind === 'string' ? oro.kind : '';
          const se = oro.stairEndpoint;
          if (se !== undefined && se !== null) {
            if (kindStr !== 'stairs') {
              errors.push({
                path: `${op}.stairEndpoint`,
                code: 'INVALID',
                message: 'stairEndpoint is only allowed when object kind is stairs',
              });
            } else if (typeof se !== 'object') {
              errors.push({
                path: `${op}.stairEndpoint`,
                code: 'INVALID',
                message: 'stairEndpoint must be an object when set',
              });
            } else {
              const ser = se as Record<string, unknown>;
              if (typeof ser.direction !== 'string' || !STAIR_DIRECTION_SET.has(ser.direction)) {
                errors.push({
                  path: `${op}.stairEndpoint.direction`,
                  code: 'INVALID',
                  message: `direction must be one of: ${LOCATION_MAP_STAIR_ENDPOINT_DIRECTION_IDS.join(', ')}`,
                });
              }
              if (ser.targetLocationId !== undefined && ser.targetLocationId !== null) {
                if (typeof ser.targetLocationId !== 'string' || ser.targetLocationId.trim() === '') {
                  errors.push({
                    path: `${op}.stairEndpoint.targetLocationId`,
                    code: 'INVALID',
                    message: 'targetLocationId must be a non-empty string when set',
                  });
                }
              }
              if (ser.connectionId !== undefined && ser.connectionId !== null) {
                if (typeof ser.connectionId !== 'string' || ser.connectionId.trim() === '') {
                  errors.push({
                    path: `${op}.stairEndpoint.connectionId`,
                    code: 'INVALID',
                    message: 'connectionId must be a non-empty string when set',
                  });
                }
              }
              const allowed = new Set(['direction', 'targetLocationId', 'connectionId']);
              for (const k of Object.keys(ser)) {
                if (!allowed.has(k)) {
                  errors.push({
                    path: `${op}.stairEndpoint.${k}`,
                    code: 'INVALID',
                    message: `unknown stairEndpoint field "${k}"`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
  return errors;
}
