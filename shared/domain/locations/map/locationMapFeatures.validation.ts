/**
 * Structural validation for map-level path segments and edge features.
 */
import { parseGridCellId } from '../../grid/gridCellIds';
import {
  LOCATION_MAP_EDGE_FEATURE_KIND_IDS,
  type LocationMapEdgeFeatureKindId,
} from './locationMapEdgeFeature.constants';
import {
  LOCATION_MAP_PATH_FEATURE_KIND_IDS,
  type LocationMapPathFeatureKindId,
} from './locationMapPathFeature.constants';
import type { LocationMapValidationError } from './locationMap.validation';

const PATH_KIND_SET = new Set<string>(LOCATION_MAP_PATH_FEATURE_KIND_IDS as readonly string[]);
const EDGE_KIND_SET = new Set<string>(LOCATION_MAP_EDGE_FEATURE_KIND_IDS as readonly string[]);

function isOrthogonalAdjacentSquare(a: string, b: string): boolean {
  const pa = parseGridCellId(a);
  const pb = parseGridCellId(b);
  if (!pa || !pb) return false;
  const dx = Math.abs(pa.x - pb.x);
  const dy = Math.abs(pa.y - pb.y);
  return dx + dy === 1;
}

function cellInBounds(cellId: string, width: number, height: number): boolean {
  const p = parseGridCellId(cellId);
  if (!p) return false;
  return p.x >= 0 && p.y >= 0 && p.x < width && p.y < height;
}

export function validatePathSegmentsStructure(
  pathSegments: unknown,
  width: number,
  height: number,
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
  if (pathSegments === undefined || pathSegments === null) return errors;
  if (!Array.isArray(pathSegments)) {
    return [{ path: 'pathSegments', code: 'INVALID', message: 'pathSegments must be an array' }];
  }
  const seenIds = new Set<string>();
  for (let i = 0; i < pathSegments.length; i++) {
    const prefix = `pathSegments[${i}]`;
    const row = pathSegments[i];
    if (!row || typeof row !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each path segment must be an object' });
      continue;
    }
    const o = row as Record<string, unknown>;
    if (typeof o.id !== 'string' || o.id.trim() === '') {
      errors.push({ path: `${prefix}.id`, code: 'REQUIRED', message: 'id is required' });
    } else if (seenIds.has(o.id)) {
      errors.push({ path: `${prefix}.id`, code: 'DUPLICATE', message: `Duplicate path segment id "${o.id}"` });
    } else {
      seenIds.add(o.id);
    }
    if (typeof o.kind !== 'string' || !PATH_KIND_SET.has(o.kind)) {
      errors.push({
        path: `${prefix}.kind`,
        code: 'INVALID',
        message: `kind must be one of: ${LOCATION_MAP_PATH_FEATURE_KIND_IDS.join(', ')}`,
      });
    }
    const start = typeof o.startCellId === 'string' ? o.startCellId.trim() : '';
    const end = typeof o.endCellId === 'string' ? o.endCellId.trim() : '';
    if (!start) {
      errors.push({ path: `${prefix}.startCellId`, code: 'REQUIRED', message: 'startCellId is required' });
    } else if (!cellInBounds(start, width, height)) {
      errors.push({
        path: `${prefix}.startCellId`,
        code: 'OUT_OF_RANGE',
        message: 'startCellId must be within grid bounds',
      });
    }
    if (!end) {
      errors.push({ path: `${prefix}.endCellId`, code: 'REQUIRED', message: 'endCellId is required' });
    } else if (!cellInBounds(end, width, height)) {
      errors.push({
        path: `${prefix}.endCellId`,
        code: 'OUT_OF_RANGE',
        message: 'endCellId must be within grid bounds',
      });
    }
    if (start && end && cellInBounds(start, width, height) && cellInBounds(end, width, height)) {
      if (!isOrthogonalAdjacentSquare(start, end)) {
        errors.push({
          path: `${prefix}.startCellId`,
          code: 'INVALID',
          message: 'Path segment endpoints must be orthogonally adjacent cells',
        });
      }
    }
  }
  return errors;
}

const BETWEEN_EDGE = /^between:([^|]+)\|([^|]+)$/;

export function validateEdgeFeaturesStructure(
  edgeFeatures: unknown,
  width: number,
  height: number,
): LocationMapValidationError[] {
  const errors: LocationMapValidationError[] = [];
  if (edgeFeatures === undefined || edgeFeatures === null) return errors;
  if (!Array.isArray(edgeFeatures)) {
    return [{ path: 'edgeFeatures', code: 'INVALID', message: 'edgeFeatures must be an array' }];
  }
  const seenIds = new Set<string>();
  for (let i = 0; i < edgeFeatures.length; i++) {
    const prefix = `edgeFeatures[${i}]`;
    const row = edgeFeatures[i];
    if (!row || typeof row !== 'object') {
      errors.push({ path: prefix, code: 'INVALID', message: 'Each edge feature must be an object' });
      continue;
    }
    const o = row as Record<string, unknown>;
    if (typeof o.id !== 'string' || o.id.trim() === '') {
      errors.push({ path: `${prefix}.id`, code: 'REQUIRED', message: 'id is required' });
    } else if (seenIds.has(o.id)) {
      errors.push({ path: `${prefix}.id`, code: 'DUPLICATE', message: `Duplicate edge feature id "${o.id}"` });
    } else {
      seenIds.add(o.id);
    }
    if (typeof o.kind !== 'string' || !EDGE_KIND_SET.has(o.kind)) {
      errors.push({
        path: `${prefix}.kind`,
        code: 'INVALID',
        message: `kind must be one of: ${LOCATION_MAP_EDGE_FEATURE_KIND_IDS.join(', ')}`,
      });
    }
    if (typeof o.edgeId !== 'string' || o.edgeId.trim() === '') {
      errors.push({ path: `${prefix}.edgeId`, code: 'REQUIRED', message: 'edgeId is required' });
      continue;
    }
    const m = BETWEEN_EDGE.exec(o.edgeId.trim());
    if (!m) {
      errors.push({
        path: `${prefix}.edgeId`,
        code: 'INVALID',
        message: 'edgeId must match between:cellA|cellB',
      });
      continue;
    }
    const ca = m[1].trim();
    const cb = m[2].trim();
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
  }
  return errors;
}
