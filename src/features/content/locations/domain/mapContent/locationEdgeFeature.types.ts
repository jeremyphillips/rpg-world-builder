/**
 * Edge feature kinds: content that lives on **cell boundaries** (walls, windows, doors).
 *
 * Distinct from path strokes and from objects with a cell footprint.
 *
 * Future tool intent: dedicated **edge** tool; not paint-fill or place-object flows.
 *
 * **Base kinds** (`wall`, `window`, `door`) remain the persisted `edgeEntries[].kind` values.
 * Structured facet types live in `shared/.../locationEdgeFeature.facets.ts`; per-kind **supported**
 * facet lists on {@link LOCATION_EDGE_FEATURE_KIND_META} are for future variation, not current
 * instance data.
 */

import type {
  LocationDoorLockStateId,
  LocationDoorWidthId,
  LocationEdgeFeatureCategory,
  LocationEdgeMaterialId,
  LocationWindowVariantId,
} from '@/shared/domain/locations/map/locationEdgeFeature.facets';

import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

export type {
  LocationDoorLockStateId,
  LocationDoorWidthId,
  LocationEdgeFeatureCategory,
  LocationEdgeMaterialId,
  LocationWindowVariantId,
} from '@/shared/domain/locations/map/locationEdgeFeature.facets';

export { LOCATION_EDGE_MATERIAL_IDS } from '@/shared/domain/locations/map/locationEdgeFeature.facets';

/** Same union as {@link LocationMapEdgeKindId} — shared `LOCATION_MAP_EDGE_KIND_IDS` is the id source. */
export type LocationEdgeFeatureKindId = LocationMapEdgeKindId;

export { LOCATION_MAP_EDGE_KIND_IDS as LOCATION_EDGE_FEATURE_KIND_IDS } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';

/**
 * Authoring metadata for a base edge kind, plus **optional** declarations of which facet values
 * that kind may support once instance-level facets exist.
 *
 * @remarks **TODO:** palette, SVG styling, and placement still key off `kind` + existing tokens
 * only; supported-facet arrays are **not** used for filtering or defaults in the UI yet.
 */
export type LocationEdgeFeatureKindMeta = {
  label: string;
  description?: string;
  /**
   * Optional grouping for future edge browser / filters.
   * @remarks **TODO:** not read by current editor chrome.
   */
  edgeCategory?: LocationEdgeFeatureCategory;
  /**
   * Declared materials for `wall` when per-edge material is added to the model.
   * @remarks **TODO:** not stored on `LocationMapEdgeAuthoringEntry` yet.
   */
  supportedMaterials?: readonly LocationEdgeMaterialId[];
  /**
   * Declared window styles for `window` when variant facets are added.
   * @remarks **TODO:** rendering uses base `window` kind only today.
   */
  supportedWindowVariants?: readonly LocationWindowVariantId[];
  /**
   * Declared lock states for `door` when persisted on edges.
   * @remarks **TODO:** no lock state in encounter/build pipeline from edges yet.
   */
  supportedDoorLockStates?: readonly LocationDoorLockStateId[];
  /**
   * Declared widths for `door` when geometry respects them.
   * @remarks **TODO:** passage logic still ignores width facets.
   */
  supportedDoorWidths?: readonly LocationDoorWidthId[];
};

/**
 * Labels and **future-facing** supported-facet declarations per base kind.
 * Keys must match {@link LOCATION_MAP_EDGE_KIND_IDS}.
 */
export const LOCATION_EDGE_FEATURE_KIND_META = {
  wall: {
    label: 'Wall',
    description: 'Solid boundary between cells.',
    edgeCategory: 'barrier',
    supportedMaterials: ['stone', 'wood'] as const,
  },
  window: {
    label: 'Window',
    description: 'Opening in a wall.',
    edgeCategory: 'opening',
    supportedWindowVariants: ['glass', 'stained_glass', 'open', 'bars', 'shutters'] as const,
  },
  door: {
    label: 'Door',
    description: 'Passage or threshold on an edge.',
    edgeCategory: 'passage',
    supportedDoorLockStates: ['unlocked', 'locked', 'barred'] as const,
    supportedDoorWidths: ['single', 'double'] as const,
  },
} as const satisfies Record<LocationEdgeFeatureKindId, LocationEdgeFeatureKindMeta>;
