import type { EdgeSegmentGeometry, PathPolylineGeometry } from '@/shared/domain/locations/map/locationMapGeometry.types';

import type { ResolveSelectModeInteractiveTargetParams } from './resolveSelectModeInteractiveTarget';

/** Draft fields consumed by {@link resolveSelectModeInteractiveTarget} (shared across hover vs click). */
export type SelectModeResolverDraftSlice = Pick<
  ResolveSelectModeInteractiveTargetParams,
  'objectsByCellId' | 'linkedLocationByCellId' | 'regionIdByCellId' | 'edgeEntries'
>;

export type SelectModeInteractiveTargetInputBase = Omit<
  ResolveSelectModeInteractiveTargetParams,
  'targetElement' | 'gx' | 'gy' | 'anchorCellId'
>;

/**
 * Builds the stable argument bundle for `resolveSelectModeInteractiveTarget` from draft + pick geometry.
 * Use {@link buildSelectModeInteractiveTargetInputSkipGeometry} when the grid container is unavailable.
 */
export function buildSelectModeInteractiveTargetInput(
  draft: SelectModeResolverDraftSlice,
  pathPickPolys: readonly PathPolylineGeometry[],
  edgePickGeoms: readonly EdgeSegmentGeometry[] | null,
  isHex: boolean,
): SelectModeInteractiveTargetInputBase {
  return {
    objectsByCellId: draft.objectsByCellId,
    linkedLocationByCellId: draft.linkedLocationByCellId,
    regionIdByCellId: draft.regionIdByCellId,
    pathPolys: pathPickPolys,
    edgeGeoms: edgePickGeoms,
    edgeEntries: draft.edgeEntries,
    isHex,
  };
}

/** Same resolver fields as full geometry, but path/edge picks disabled (DOM + interior resolution only). */
export function buildSelectModeInteractiveTargetInputSkipGeometry(
  draft: SelectModeResolverDraftSlice,
  isHex: boolean,
): SelectModeInteractiveTargetInputBase {
  return {
    objectsByCellId: draft.objectsByCellId,
    linkedLocationByCellId: draft.linkedLocationByCellId,
    regionIdByCellId: draft.regionIdByCellId,
    pathPolys: [],
    edgeGeoms: null,
    edgeEntries: [],
    isHex,
    skipGeometry: true,
  };
}
