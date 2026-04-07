import type { LocationScaleId } from '@/shared/domain/locations';

import type { LocationCellFillFamilyId } from '../map/locationCellFill.types';
import type { LocationEdgeFeatureKindId } from '../map/locationEdgeFeature.types';
import type { LocationPathFeatureKindId } from '../map/locationPathFeature.types';
import type { LocationPlacedObjectKindId } from '../placedObjects/locationPlacedObject.types';
import { getPlacedObjectKindsForScale } from '../placedObjects/locationPlacedObject.selectors';

/**
 * Per-scale vocabulary for **authored map content** (fills, paths, edges, placed objects).
 *
 * **Keyed by `LocationScaleId`:** includes `region`, `subregion`, `district` so the record is exhaustive for persisted
 * host locations — those keys currently use **empty** policy buckets (no paint/place tools) while legacy rows exist.
 * Do **not** read “has a key” as “recommended authoring surface”; new map authoring targets **content** scales
 * (`world`, `city`, `floor`, …) per product rules.
 *
 * Separate from `LOCATION_SCALE_FIELD_POLICY` (form/setup: categories, cell units, geometry).
 * Separate from `locationMapPlacement.policy.ts` (which legacy cell-object kinds may appear on cells).
 *
 * First-pass focus: **world**, **city**, and **floor**; other scales use empty lists until extended.
 *
 * Future tools (not implemented here):
 * - **Paint** → cell fills + path features
 * - **Edge** → edge features
 * - **Place** → placed objects
 */
export type LocationScaleMapContentPolicy = {
  /** Allowed cell-fill **family** ids; all variants in a family are available unless filtered elsewhere. */
  cellFillFamilies: readonly LocationCellFillFamilyId[];
  pathKinds: readonly LocationPathFeatureKindId[];
  edgeKinds: readonly LocationEdgeFeatureKindId[];
  objectKinds: readonly LocationPlacedObjectKindId[];
};

const EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY: LocationScaleMapContentPolicy = {
  cellFillFamilies: [],
  pathKinds: [],
  edgeKinds: [],
  objectKinds: [],
};

export const LOCATION_SCALE_MAP_CONTENT_POLICY: Record<
  LocationScaleId,
  LocationScaleMapContentPolicy
> = {
  world: {
    cellFillFamilies: ['mountains', 'plains', 'forest', 'swamp', 'desert', 'water'],
    pathKinds: ['road', 'river'],
    edgeKinds: [],
    objectKinds: [...getPlacedObjectKindsForScale('world')],
  },
  city: {
    cellFillFamilies: [],
    pathKinds: ['road'],
    edgeKinds: [],
    objectKinds: [...getPlacedObjectKindsForScale('city')],
  },
  floor: {
    cellFillFamilies: ['floor'],
    pathKinds: [],
    /** Draw tool: wall boundary-paint only — doors/windows use Place (`placementMode: 'edge'`) on the same `edgeEntries` wire. */
    edgeKinds: ['wall'],
    objectKinds: [...getPlacedObjectKindsForScale('floor')],
  },
  region: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
  subregion: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
  district: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
  site: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
  building: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
  room: EMPTY_LOCATION_SCALE_MAP_CONTENT_POLICY,
};

export function getLocationScaleMapContentPolicy(
  scale: LocationScaleId,
): LocationScaleMapContentPolicy {
  return LOCATION_SCALE_MAP_CONTENT_POLICY[scale];
}

export function getAllowedCellFillFamiliesForScale(
  scale: LocationScaleId,
): readonly LocationCellFillFamilyId[] {
  return getLocationScaleMapContentPolicy(scale).cellFillFamilies;
}

export function getAllowedPathKindsForScale(
  scale: LocationScaleId,
): readonly LocationPathFeatureKindId[] {
  return getLocationScaleMapContentPolicy(scale).pathKinds;
}

export function getAllowedEdgeKindsForScale(
  scale: LocationScaleId,
): readonly LocationEdgeFeatureKindId[] {
  return getLocationScaleMapContentPolicy(scale).edgeKinds;
}

export function getAllowedPlacedObjectKindsForScale(
  scale: LocationScaleId,
): readonly LocationPlacedObjectKindId[] {
  return getPlacedObjectKindsForScale(scale);
}
