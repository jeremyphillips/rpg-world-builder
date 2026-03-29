/**
 * Pure hierarchy rules for locations (scale ordering + ancestor id construction).
 * Async DB validation lives in locations.service.ts.
 */

import {
  LOCATION_SCALE_ORDER,
  type LocationScaleId,
} from '../../../../../shared/domain/locations';

export { LOCATION_SCALE_ORDER, type LocationScaleId };

export type HierarchyValidationError = {
  path: string;
  code: string;
  message: string;
};

/** Lower index = broader geographic scope. Returns -1 if scale is unknown. */
export function scaleRank(scale: string): number {
  return LOCATION_SCALE_ORDER.indexOf(scale as LocationScaleId);
}

/**
 * Parent must be strictly broader than child (smaller rank index).
 * Same-scale parenting is rejected for this first-pass rule.
 */
export function validateParentChildScales(
  parentScale: string,
  childScale: string,
): HierarchyValidationError | null {
  const pi = scaleRank(parentScale);
  const ci = scaleRank(childScale);
  if (pi === -1) {
    return {
      path: 'parentId',
      code: 'INVALID_SCALE',
      message: `Parent has unknown scale "${parentScale}"`,
    };
  }
  if (ci === -1) {
    return {
      path: 'scale',
      code: 'INVALID_SCALE',
      message: `Unknown scale "${childScale}"`,
    };
  }
  if (pi >= ci) {
    return {
      path: 'parentId',
      code: 'INVALID_NESTING',
      message: 'Parent scale must be broader than child scale (same-scale parenting is not allowed)',
    };
  }
  return null;
}

/** ancestorIds for a node whose parent is `parentRow` (root has no parent row). */
export function buildAncestorIdsFromParentRow(parentRow: {
  locationId: string;
  ancestorIds?: string[];
}): string[] {
  const ancestors = parentRow.ancestorIds ?? [];
  return [...ancestors, parentRow.locationId];
}
