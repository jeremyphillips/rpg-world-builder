/**
 * Cell fills: whole-cell terrain / surface paint — **family + variant** registry.
 *
 * Presentation uses swatch colors (`swatchColorKey`) and optional `imageKey` textures on the fill layer.
 *
 * Canonical registry: `shared/domain/locations/map/authoredCellFillDefinitions.ts`.
 */

export type {
  LocationCellFillBiome,
  LocationCellFillCategory,
  LocationCellFillDensity,
  LocationCellFillFamily,
  LocationCellFillMaterialId,
} from '@/shared/domain/locations/map/locationMapCellFill.facets';

export { LOCATION_CELL_FILL_MATERIAL_IDS } from '@/shared/domain/locations/map/locationMapCellFill.facets';

export type {
  AuthoredCellFillFamilyDefinition,
  AuthoredCellFillVariantDefinition,
  LocationCellFillFamilyId,
} from '@/shared/domain/locations/map/authoredCellFillDefinitions';

export {
  AUTHORED_CELL_FILL_DEFINITIONS,
  LOCATION_CELL_FILL_FAMILY_IDS,
  getAuthoredCellFillFamilyDefinition,
  isCellFillFamilyAllowedOnScale,
  resolveCellFillVariant,
} from '@/shared/domain/locations/map/authoredCellFillDefinitions';

export type { LocationMapCellFillSelection } from '@/shared/domain/locations/map/locationMap.types';
