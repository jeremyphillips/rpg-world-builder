/**
 * Pure hierarchy rules for locations (scale ordering + ancestor id construction).
 * Parent/child *scale pairing* is enforced via explicit policy in shared `locationScale.policy.ts`
 * (`isAllowedParentScale`), not by rank comparison alone.
 * Async DB validation lives in locations.service.ts.
 */

import {
  LOCATION_SCALE_ORDER,
  type LocationScaleId,
} from '../../../../../shared/domain/locations';

export { LOCATION_SCALE_ORDER, type LocationScaleId };

export {
  validateParentChildScales,
  type HierarchyValidationError,
} from '../../../../../shared/domain/locations';

/** Lower index = broader geographic scope. Returns -1 if scale is unknown. */
export function scaleRank(scale: string): number {
  return LOCATION_SCALE_ORDER.indexOf(scale as LocationScaleId);
}

/** ancestorIds for a node whose parent is `parentRow` (root has no parent row). */
export function buildAncestorIdsFromParentRow(parentRow: {
  locationId: string;
  ancestorIds?: string[];
}): string[] {
  const ancestors = parentRow.ancestorIds ?? [];
  return [...ancestors, parentRow.locationId];
}
