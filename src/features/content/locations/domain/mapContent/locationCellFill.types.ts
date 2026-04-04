/**
 * Cell fill kinds: whole-cell surfaces / terrain / flooring for authored map content.
 *
 * These represent paint-style coverage of an entire grid cell, not strokes along paths,
 * not boundary decorations, and not anchored props.
 *
 * Future tool intent: **paint** tools will combine cell fills with path features (see
 * `locationPathFeature.types.ts`).
 *
 * Presentation: surface fills use **swatch colors** only (`swatchColorKey` via `getMapSwatchColor`
 * / `mapSwatchColors` in `src/app/theme/mapColors.ts`). They are not rendered as MUI icons.
 *
 * Canonical fill-kind ids and metadata live in `shared/domain/locations/map/locationMapCellFill.constants.ts`.
 * Structured facets (category, family, …) are defined in `locationMapCellFill.facets.ts`.
 */

import type { LocationMapCellFillKindId as SharedCellFillKindId } from '@/shared/domain/locations/map/locationMapCellFill.constants';

export type {
  LocationCellFillBiome,
  LocationCellFillCategory,
  LocationCellFillDensity,
  LocationCellFillFamily,
  LocationCellFillMaterialId,
} from '@/shared/domain/locations/map/locationMapCellFill.facets';

export { LOCATION_CELL_FILL_MATERIAL_IDS } from '@/shared/domain/locations/map/locationMapCellFill.facets';

export type {
  LocationCellFillKindMeta,
  LocationMapCellFillKindId,
} from '@/shared/domain/locations/map/locationMapCellFill.constants';

export {
  LOCATION_CELL_FILL_KIND_META,
  LOCATION_MAP_CELL_FILL_KIND_IDS,
} from '@/shared/domain/locations/map/locationMapCellFill.constants';

/** Re-export shared ids for feature consumers; same union as {@link LocationCellFillKindId}. */
export { LOCATION_MAP_CELL_FILL_KIND_IDS as LOCATION_CELL_FILL_KIND_IDS } from '@/shared/domain/locations/map/locationMapCellFill.constants';

/** Sparse cell fill kind (shared persistence + map editor). */
export type LocationCellFillKindId = SharedCellFillKindId;
