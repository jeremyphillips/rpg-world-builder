/**
 * Structural validation for map-level path entries and edge entries.
 */
import { parseGridCellId } from '../../grid/gridCellIds';
import {
  neighborSquareCellId,
  parseSquareEdgeId,
  type SquareCellSide,
} from '../../grid/gridEdgeIds';
import type { GridGeometryId } from '../../grid/gridGeometry';
import { getNeighborPoints } from '../../grid/gridHelpers';
import {
  LOCATION_MAP_EDGE_KIND_IDS,
} from './locationMapEdgeFeature.constants';
import {
  LOCATION_MAP_PATH_KIND_IDS,
} from './locationMapPathFeature.constants';
import type { LocationMapValidationError } from './locationMap.validation';

const PATH_KIND_SET = new Set<string>(LOCATION_MAP_PATH_KIND_IDS as readonly string[]);
const EDGE_KIND_SET = new Set<string>(LOCATION_MAP_EDGE_KIND_IDS as readonly string[]);

function isOrthogonalAdjacentSquare(a: string, b: string): boolean {
  const pa = parseGridCellId(a);
  const pb = parseGridCellId(b);
  if (!pa || !pb) return false;
  const dx = Math.abs(pa.x - pb.x);
  const dy = Math.abs(pa.y - pb.y);
  return dx + dy === 1;
}

function areCellsAdjacent(
  a: string,
  b: string,
  width: number,
  height: number,
  geometry: GridGeometryId,
): boolean {
  if (geometry === 'square') return isOrthogonalAdjacentSquare(a, b);
  const pa = parseGridCellId(a);
  const pb = parseGridCellId(b);
  if (!pa || !pb) return false;
  const neighbors = getNeighborPoints({ geometry, columns: width, rows: height }, pa);
  return neighbors.some((n) => n.x === pb.x && n.y === pb.y);
}

function cellInBounds(cellId: string, width: number, height: number): boolean {
  const p = parseGridCellId(cellId);
  if (!p) return false;
  return p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;
}

function neighborExistsOnSide(
  cellId: string,
  side: SquareCellSide,
  width: number,
  height: number,
): boolean {
  return neighborSquareCellId(cellId, side, width, height) !== null;
}

export function validatePathEntriesStructure(
  pathEntries: unknown,
  width: number,
  height: number,
  geometry: GridGeometryId = 'square',
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
  if (pathEntries === undefined || pathEntries === null) return errors;
  if (!Array.isArray(pathEntries)) {
    return [{ path: 'pathEntries', code: 'INVALID', message: 'pathEntries must be an array' }];
  }
  const seenIds = new Set<string>();
  for (let i = 0; i < pathEntries.length; i++) {
    const prefix = `pathEntries[${i}]`;
    const row = pathEntries[i];
    if (!row || typeof row !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each path entry must be an object' });
      continue;
    }
    const o = row as Record<string, unknown>;
    if (typeof o.id !== 'string' || o.id.trim() === '') {
      errors.push({ path: `${prefix}.id`, code: 'REQUIRED', message: 'id is required' });
    } else if (seenIds.has(o.id)) {
      errors.push({ path: `${prefix}.id`, code: 'DUPLICATE', message: `Duplicate path entry id "${o.id}"` });
    } else {
      seenIds.add(o.id);
    }
    if (typeof o.kind !== 'string' || !PATH_KIND_SET.has(o.kind)) {
      errors.push({
        path: `${prefix}.kind`,
        code: 'INVALID',
        message: `kind must be one of: ${LOCATION_MAP_PATH_KIND_IDS.join(', ')}`,
      });
    }
    if (!Array.isArray(o.cellIds)) {
      errors.push({ path: `${prefix}.cellIds`, code: 'INVALID', message: 'cellIds must be an array' });
      continue;
    }
    if (o.cellIds.length < 2) {
      errors.push({
        path: `${prefix}.cellIds`,
        code: 'INVALID',
        message: 'cellIds must contain at least two cells',
      });
      continue;
    }
    for (let j = 0; j < o.cellIds.length; j++) {
      const cid = typeof o.cellIds[j] === 'string' ? (o.cellIds[j] as string).trim() : '';
      const cellPrefix = `${prefix}.cellIds[${j}]`;
      if (!cid) {
        errors.push({ path: cellPrefix, code: 'REQUIRED', message: 'Each cell id must be a non-empty string' });
      } else if (!cellInBounds(cid, width, height)) {
        errors.push({
          path: cellPrefix,
          code: 'OUT_OF_RANGE',
          message: 'cell id must be within grid bounds',
        });
      }
    }
    const ids = o.cellIds as string[];
    let chainOk = true;
    for (let j = 0; j < ids.length - 1; j++) {
      const a = ids[j].trim();
      const b = ids[j + 1].trim();
      if (!a || !b) continue;
      if (cellInBounds(a, width, height) && cellInBounds(b, width, height)) {
        if (!areCellsAdjacent(a, b, width, height, geometry)) {
          errors.push({
            path: `${prefix}.cellIds`,
            code: 'INVALID',
            message: 'Consecutive cells in cellIds must be grid-adjacent',
          });
          chainOk = false;
          break;
        }
      }
    }
    if (!chainOk) continue;
  }
  return errors;
}

export function validateEdgeEntriesStructure(
  edgeEntries: unknown,
  width: number,
  height: number,
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
  if (edgeEntries === undefined || edgeEntries === null) return errors;
  if (!Array.isArray(edgeEntries)) {
    return [{ path: 'edgeEntries', code: 'INVALID', message: 'edgeEntries must be an array' }];
  }
  const seenEdgeIds = new Set<string>();
  for (let i = 0; i < edgeEntries.length; i++) {
    const prefix = `edgeEntries[${i}]`;
    const row = edgeEntries[i];
    if (!row || typeof row !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each edge entry must be an object' });
      continue;
    }
    const o = row as Record<string, unknown>;
    if (typeof o.kind !== 'string' || !EDGE_KIND_SET.has(o.kind)) {
      errors.push({
        path: `${prefix}.kind`,
        code: 'INVALID',
        message: `kind must be one of: ${LOCATION_MAP_EDGE_KIND_IDS.join(', ')}`,
      });
    }
    if (typeof o.edgeId !== 'string' || o.edgeId.trim() === '') {
      errors.push({ path: `${prefix}.edgeId`, code: 'REQUIRED', message: 'edgeId is required' });
      continue;
    }
    const eid = o.edgeId.trim();
    if (seenEdgeIds.has(eid)) {
      errors.push({
        path: `${prefix}.edgeId`,
        code: 'DUPLICATE',
        message: `Duplicate edgeId "${eid}"`,
      });
    } else {
      seenEdgeIds.add(eid);
    }
    const parsed = parseSquareEdgeId(eid);
    if (!parsed) {
      errors.push({
        path: `${prefix}.edgeId`,
        code: 'INVALID',
        message: 'edgeId must be a valid square edge id (between:cellA|cellB or perimeter:cellId|side)',
      });
      continue;
    }
    if (parsed.kind === 'between') {
      const ca = parsed.cellA;
      const cb = parsed.cellB;
      if (
        !cellInBounds(ca, width, height) ||
        !cellInBounds(cb, width, height) ||
        !isOrthogonalAdjacentSquare(ca, cb)
      ) {
        errors.push({
          path: `${prefix}.edgeId`,
          code: 'INVALID',
          message: 'edgeId must reference two orthogonally adjacent in-bounds cells',
        });
      }
    } else {
      const cid = parsed.cellId;
      if (!cellInBounds(cid, width, height)) {
        errors.push({
          path: `${prefix}.edgeId`,
          code: 'INVALID',
          message: 'perimeter edgeId must reference an in-bounds cell',
        });
      } else if (neighborExistsOnSide(cid, parsed.side, width, height)) {
        errors.push({
          path: `${prefix}.edgeId`,
          code: 'INVALID',
          message: 'perimeter edgeId must use a side on the outer map boundary (no neighbor)',
        });
      }
    }
  }
  return errors;
}
