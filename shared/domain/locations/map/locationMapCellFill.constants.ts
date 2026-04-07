/**
 * Cell-fill vocabulary is **family + variant** — see {@link AUTHORED_CELL_FILL_DEFINITIONS}.
 * Legacy flat fill kind ids are removed; persistence uses {@link LocationMapCellFillSelection}.
 */

export {
  AUTHORED_CELL_FILL_DEFINITIONS,
  AUTHORED_CELL_FILL_SWATCH_KEYS,
  LOCATION_CELL_FILL_FAMILY_IDS,
  getAuthoredCellFillFamilyDefinition,
  isCellFillFamilyAllowedOnScale,
  resolveCellFillVariant,
  type AuthoredCellFillFamilyDefinition,
  type AuthoredCellFillSwatchColorKey,
  type AuthoredCellFillVariantDefinition,
  type AuthoredCellFillVariantPresentation,
  type LocationCellFillFamilyId,
} from './authoredCellFillDefinitions';
