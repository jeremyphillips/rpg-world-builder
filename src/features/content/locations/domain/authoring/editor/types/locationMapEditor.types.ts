import type {
  LocationCellFillCategory,
  LocationCellFillFamily,
  LocationCellFillFamilyId,
} from '@/features/content/locations/domain/model/map/locationCellFill.types';
import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import type {
  LocationPlacedObjectKindId,
  PlacedObjectPaletteCategoryId,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';

/**
 * Literal often used as registry `defaultVariantId` for single-variant families.
 * Canonical default per family is the registry `defaultVariantId` field — do not assume the key is always `default`.
 */
export const DEFAULT_AUTHORED_PLACE_VARIANT_ID = 'default' as const;
import type { LocationMapSwatchColorKey } from '@/features/content/locations/domain/model/map/locationMapSwatchColors.types';
import type { LocationMapRegionColorKey } from '@/features/content/locations/domain/model/map/locationMapRegionColors.types';
import type { LocationScaleId } from '@/shared/domain/locations';

export type LocationMapEditorMode =
  | 'select'
  | 'paint'
  | 'place'
  | 'draw'
  | 'erase';

/**
 * Discrete placement (linked child locations vs local map objects). Paths and edges use
 * {@link LocationMapActiveDrawSelection} under Draw mode.
 *
 * **`kind`** is the registry **family** id (top-level key) — alias “familyKey” in Phase 2 docs.
 * **`variantId`** is family-scoped — resolve with `normalizeVariantIdForFamily` (id only) or `resolvePlacedObjectVariant` (full variant row) at place time / hydration.
 */
export type LocationMapActivePlaceSelection =
  | {
      category: 'linked-content';
      kind: LocationPlacedObjectKindId;
      variantId: string;
    }
  | {
      category: 'map-object';
      kind: LocationPlacedObjectKindId;
      variantId: string;
    }
  | null;

/** Line/boundary authoring: paths and edges share Draw mode in the UI. */
export type LocationMapActiveDrawSelection =
  | {
      category: 'path';
      kind: LocationMapPathKindId;
    }
  | {
      category: 'edge';
      kind: LocationMapEdgeKindId;
    }
  | null;

/**
 * Paint tool state: Surface (terrain fill) vs Region (authored region target).
 * Region metadata lives in draft `regionEntries`; paint state holds `activeRegionId` and, when
 * creating a region, `pendingRegionColorKey` until the first stroke commits.
 * `null` when the editor is not in Paint mode.
 */
export type LocationMapPaintState = {
  domain: 'surface' | 'region';
  /** Selected terrain/surface swatch (family + variant from {@link AUTHORED_CELL_FILL_DEFINITIONS}). */
  selectedSurfaceFill: { familyId: LocationCellFillFamilyId; variantId: string } | null;
  /** Must match an id in draft `regionEntries` when painting regions. */
  activeRegionId: string | null;
  /**
   * When `domain === 'region'` and `activeRegionId` is null, first stroke creates a region with this
   * preset color. When `activeRegionId` is set, kept in sync with the entry for tray highlight.
   */
  pendingRegionColorKey: LocationMapRegionColorKey;
};

export type LocationMapActivePaintSelection = LocationMapPaintState | null;

export type MapPaintPaletteItem = {
  familyId: LocationCellFillFamilyId;
  variantId: string;
  label: string;
  description?: string;
  swatchColorKey: LocationMapSwatchColorKey;
};

/** One **family** row in the paint tray (e.g. forest → light + heavy). */
export type MapPaintPaletteFamilyRow = {
  familyId: LocationCellFillFamily;
  label: string;
  variants: readonly MapPaintPaletteItem[];
  /** Registry default variant id for primary-click when only one tile is shown. */
  defaultVariantId: string;
};

/** Grouped paint palette: terrain vs surface sections, each with family rows. */
export type MapPaintPaletteSection = {
  sectionId: LocationCellFillCategory;
  label: string;
  families: readonly MapPaintPaletteFamilyRow[];
};

/** Place palette: linked content vs map objects only (policy + meta). One row per **family**. */
export type MapPlacePaletteItem =
  | {
      category: 'linked-content';
      kind: LocationPlacedObjectKindId;
      /** Family id for registry (same as `kind`). */
      familyId: LocationPlacedObjectKindId;
      /** Primary-click variant (same as `defaultVariantId` on this row); Phase 2 keeps linked rows single-variant. */
      variantId: string;
      defaultVariantId: string;
      variantCount: number;
      /** Registry palette grouping — not persisted. */
      paletteCategory: PlacedObjectPaletteCategoryId;
      label: string;
      description?: string;
      /** Bundled preview image URL for the default variant tile. */
      previewImageUrl: string;
      linkedScale: LocationScaleId;
    }
  | {
      category: 'map-object';
      kind: LocationPlacedObjectKindId;
      familyId: LocationPlacedObjectKindId;
      variantId: string;
      defaultVariantId: string;
      variantCount: number;
      paletteCategory: PlacedObjectPaletteCategoryId;
      /** Label/icon for the default variant (primary tile). */
      label: string;
      description?: string;
      previewImageUrl: string;
    };

/** Draw palette: paths and edges (policy + meta). */
export type MapDrawPaletteItem =
  | {
      category: 'path';
      kind: LocationMapPathKindId;
      label: string;
      description?: string;
    }
  | {
      category: 'edge';
      kind: LocationMapEdgeKindId;
      label: string;
      description?: string;
    };
