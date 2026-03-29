/**
 * Centralized UI + validation policy for location scale — categories, cell units, and field visibility.
 *
 * Parent-scale eligibility stays in `locationScale.policy.ts`.
 * Map kind / placement hooks can extend this module later (`allowedMapKinds`, etc.).
 */
import { LOCATION_SCALE_ORDER } from '../location.constants';
import type { LocationCategoryId, LocationScaleId } from '../location.types';
import { LOCATION_CELL_UNIT_IDS } from '../map/locationMap.constants';
import { isValidLocationScaleId, isWorldScale } from './locationScale.rules';
import type { GridGeometryId } from '../../grid/gridGeometry';

export type LocationCellUnitId = (typeof LOCATION_CELL_UNIT_IDS)[number];

/**
 * Per-scale rules for category, default-map cell unit, and which form fields to show.
 * Keep values explicit — avoid inferring from map kind alone so this file stays scannable.
 */
export type LocationScaleFieldPolicy = {
  /** Categories permitted for this scale (empty = none). */
  allowedCategories: readonly LocationCategoryId[];
  /** Cell units permitted for the location’s default map grid at this scale. */
  allowedCellUnits: readonly LocationCellUnitId[];
  /** When set, category is forced to this value (and the field is typically hidden in UI). */
  fixedCategory?: LocationCategoryId;
  /** When set, grid cell unit is forced to this value (field often hidden when only one choice). */
  fixedCellUnit?: LocationCellUnitId;
  /** Hide category control entirely (e.g. world). */
  hideCategory?: boolean;
  /** Hide parent picker (e.g. world). */
  hideParent?: boolean;
  /** Hide default-map cell unit control when there is only one valid unit. */
  hideGridCellUnit?: boolean;
  /**
   * If true, the scale field may be edited after create. Server currently forbids all scale changes;
   * keep false for all scales until the API allows exceptions.
   */
  isScaleEditableOnEdit?: boolean;
  /** Grid geometries permitted for the location's default map at this scale. */
  allowedGeometries: readonly GridGeometryId[];
  /** Default geometry for new maps at this scale. */
  defaultGeometry?: GridGeometryId;
  /** Hide geometry control when there is only one valid geometry. */
  hideGridGeometry?: boolean;
  /* Future: allowedMapKinds, defaultMapKind, linkedLocationPolicy, objectPlacementPolicy — see locationMapPlacement.policy.ts today. */
};

const mile = ['mile'] as const;
const block = ['block'] as const;
const fiveFt = ['5ft'] as const;
const mileBlock = ['mile', 'block'] as const;
const block5 = ['block', '5ft'] as const;

const hexOnly = ['hex'] as const;
const squareOnly = ['square'] as const;
const squareHex = ['square', 'hex'] as const;

/**
 * Single source of truth for scale-specific category + cell-unit rules.
 */
export const LOCATION_SCALE_FIELD_POLICY = {
  world: {
    allowedCategories: [],
    allowedCellUnits: mile,
    fixedCellUnit: 'mile',
    hideCategory: true,
    hideParent: true,
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: hexOnly,
    defaultGeometry: 'hex',
    hideGridGeometry: true,
  },
  region: {
    allowedCategories: ['wilderness', 'landmark'],
    allowedCellUnits: mile,
    fixedCellUnit: 'mile',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: hexOnly,
    defaultGeometry: 'hex',
    hideGridGeometry: true,
  },
  subregion: {
    allowedCategories: ['wilderness', 'landmark', 'settlement'],
    allowedCellUnits: mileBlock,
    isScaleEditableOnEdit: false,
    allowedGeometries: hexOnly,
    defaultGeometry: 'hex',
    hideGridGeometry: true,
  },
  city: {
    allowedCategories: ['settlement'],
    fixedCategory: 'settlement',
    allowedCellUnits: block,
    fixedCellUnit: 'block',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareHex,
    defaultGeometry: 'hex',
  },
  district: {
    allowedCategories: ['district'],
    fixedCategory: 'district',
    allowedCellUnits: block,
    fixedCellUnit: 'block',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareHex,
    defaultGeometry: 'square',
  },
  site: {
    allowedCategories: ['landmark', 'structure', 'dungeon'],
    allowedCellUnits: block5,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareHex,
    defaultGeometry: 'square',
  },
  building: {
    allowedCategories: ['structure'],
    fixedCategory: 'structure',
    allowedCellUnits: fiveFt,
    fixedCellUnit: '5ft',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareOnly,
    defaultGeometry: 'square',
    hideGridGeometry: true,
  },
  floor: {
    allowedCategories: ['interior'],
    fixedCategory: 'interior',
    allowedCellUnits: fiveFt,
    fixedCellUnit: '5ft',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareOnly,
    defaultGeometry: 'square',
    hideGridGeometry: true,
  },
  room: {
    allowedCategories: ['interior'],
    fixedCategory: 'interior',
    allowedCellUnits: fiveFt,
    fixedCellUnit: '5ft',
    hideGridCellUnit: true,
    isScaleEditableOnEdit: false,
    allowedGeometries: squareOnly,
    defaultGeometry: 'square',
    hideGridGeometry: true,
  },
} as const satisfies Record<LocationScaleId, LocationScaleFieldPolicy>;

const FALLBACK_POLICY: LocationScaleFieldPolicy = {
  allowedCategories: [],
  allowedCellUnits: ['5ft'],
  fixedCellUnit: '5ft',
  hideCategory: true,
  hideParent: true,
  hideGridCellUnit: true,
  isScaleEditableOnEdit: false,
  allowedGeometries: ['square'],
  defaultGeometry: 'square',
  hideGridGeometry: true,
};

export function getLocationScaleFieldPolicy(scale: string): LocationScaleFieldPolicy {
  if (!isValidLocationScaleId(scale)) {
    return FALLBACK_POLICY;
  }
  return LOCATION_SCALE_FIELD_POLICY[scale];
}

export function getAllowedCategoriesForScale(scale: string): readonly LocationCategoryId[] {
  return getLocationScaleFieldPolicy(scale).allowedCategories;
}

export function getAllowedCellUnitsForScale(scale: string): readonly LocationCellUnitId[] {
  return getLocationScaleFieldPolicy(scale).allowedCellUnits;
}

export function getFixedCategoryForScale(scale: string): LocationCategoryId | undefined {
  return getLocationScaleFieldPolicy(scale).fixedCategory;
}

export function getFixedCellUnitForScale(scale: string): LocationCellUnitId | undefined {
  return getLocationScaleFieldPolicy(scale).fixedCellUnit;
}

/** True if the category value is allowed for this scale (empty string allowed when optional). */
export function isCategoryAllowedForScale(categoryTrimmed: string, scale: string): boolean {
  if (categoryTrimmed === '') return true;
  const p = getLocationScaleFieldPolicy(scale);
  if (p.hideCategory || p.allowedCategories.length === 0) return false;
  if (p.fixedCategory) return categoryTrimmed === p.fixedCategory;
  return (p.allowedCategories as readonly string[]).includes(categoryTrimmed);
}

/** True if the cell unit is allowed for this scale’s default map. */
export function isCellUnitAllowedForScale(cellUnitTrimmed: string, scale: string): boolean {
  if (cellUnitTrimmed === '') return false;
  const p = getLocationScaleFieldPolicy(scale);
  if (p.fixedCellUnit) return cellUnitTrimmed === p.fixedCellUnit;
  return (p.allowedCellUnits as readonly string[]).includes(cellUnitTrimmed);
}

/**
 * Category value stored on the location after applying scale policy (fixed category, or allowed value, or '').
 */
export function normalizeCategoryForScale(category: string, scale: string): string {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.fixedCategory) return p.fixedCategory;
  if (p.hideCategory || p.allowedCategories.length === 0) return '';
  const t = String(category ?? '').trim();
  if (!t) return '';
  if ((p.allowedCategories as readonly string[]).includes(t)) return t;
  return '';
}

/**
 * Grid cell unit after applying scale policy.
 */
export function normalizeGridCellUnitForScale(unit: string, scale: string): string {
  const p = getLocationScaleFieldPolicy(scale);
  const allowed = p.allowedCellUnits as readonly string[];
  if (p.fixedCellUnit) return p.fixedCellUnit;
  const t = String(unit ?? '').trim();
  if (t && allowed.includes(t)) return t;
  return allowed[0] ?? '5ft';
}

export function getDefaultCellUnitForScalePolicy(scale: string): string {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.fixedCellUnit) return p.fixedCellUnit;
  return p.allowedCellUnits[0] ?? '5ft';
}

/** Show category control when the scale has categories; use {@link LocationFormUiPolicy#categoryFieldDisabled} for read-only fixed values. */
export function shouldShowCategoryFieldForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.hideCategory) return false;
  return p.allowedCategories.length > 0;
}

export function shouldShowParentFieldForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.hideParent) return false;
  return !isWorldScale(scale);
}

/**
 * Show default-map cell unit control when the scale defines units.
 * Use {@link LocationFormUiPolicy#gridCellUnitFieldDisabled} for read-only fixed/single-unit cases.
 */
export function shouldShowGridCellUnitFieldForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  return p.allowedCellUnits.length > 0;
}

/** Whether the scale field can be edited in edit mode (server must allow the same). */
export function isLocationScaleEditableOnEdit(scale: string): boolean {
  return getLocationScaleFieldPolicy(scale).isScaleEditableOnEdit ?? false;
}

/** Category select is read-only when the scale fixes the category (e.g. city → settlement). */
export function isCategoryFieldReadOnlyForScale(scale: string): boolean {
  return Boolean(getFixedCategoryForScale(scale));
}

/** Cell-unit select is read-only when fixed or only one allowed unit. */
export function isGridCellUnitFieldReadOnlyForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.fixedCellUnit) return true;
  return p.allowedCellUnits.length <= 1;
}

export function getCategoryOptionsForScaleUi(scale: string): { value: string; label: string }[] {
  const p = getLocationScaleFieldPolicy(scale);
  return p.allowedCategories.map((c) => ({
    value: c,
    label: c.slice(0, 1).toUpperCase() + c.slice(1),
  }));
}

export function getCellUnitOptionsForScaleUi(scale: string): { value: string; label: string }[] {
  const p = getLocationScaleFieldPolicy(scale);
  return p.allowedCellUnits.map((u) => ({ value: u, label: u }));
}

/** Label/value rows for category `<Select>` — stable name for client imports. */
export const getAllowedCategoryOptionsForScale = getCategoryOptionsForScaleUi;

/** Label/value rows for cell-unit `<Select>` — stable name for client imports. */
export const getAllowedCellUnitOptionsForScale = getCellUnitOptionsForScaleUi;

// ---------------------------------------------------------------------------
// Grid geometry accessors
// ---------------------------------------------------------------------------

export function getAllowedGeometriesForScale(scale: string): readonly GridGeometryId[] {
  return getLocationScaleFieldPolicy(scale).allowedGeometries;
}

export function getDefaultGeometryForScale(scale: string): GridGeometryId {
  const p = getLocationScaleFieldPolicy(scale);
  return p.defaultGeometry ?? 'square';
}

export function shouldShowGridGeometryFieldForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  if (p.hideGridGeometry) return false;
  return p.allowedGeometries.length > 0;
}

export function isGridGeometryFieldReadOnlyForScale(scale: string): boolean {
  const p = getLocationScaleFieldPolicy(scale);
  return p.allowedGeometries.length <= 1;
}

const GEOMETRY_LABELS: Record<GridGeometryId, string> = {
  square: 'Square',
  hex: 'Hex',
};

export function getGeometryOptionsForScaleUi(
  scale: string,
): { value: string; label: string }[] {
  const p = getLocationScaleFieldPolicy(scale);
  return p.allowedGeometries.map((g) => ({
    value: g,
    label: GEOMETRY_LABELS[g] ?? g,
  }));
}

/** Label/value rows for geometry `<Select>` — stable name for client imports. */
export const getAllowedGeometryOptionsForScale = getGeometryOptionsForScaleUi;

/** Grid geometry after applying scale policy. */
export function normalizeGridGeometryForScale(geometry: string, scale: string): GridGeometryId {
  const p = getLocationScaleFieldPolicy(scale);
  const allowed = p.allowedGeometries as readonly string[];
  const t = String(geometry ?? '').trim();
  if (t && allowed.includes(t)) return t as GridGeometryId;
  return p.defaultGeometry ?? 'square';
}
