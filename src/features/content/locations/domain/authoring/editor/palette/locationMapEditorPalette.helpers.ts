import {
  getAllowedCellFillKindsForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
} from '@/features/content/locations/domain/model/policies/locationScaleMapContent.policy';
import type {
  LocationCellFillCategory,
  LocationCellFillFamily,
} from '@/features/content/locations/domain/model/map/locationCellFill.types';
import { LOCATION_CELL_FILL_KIND_META } from '@/features/content/locations/domain/model/map/locationCellFill.types';
import { LOCATION_EDGE_FEATURE_KIND_META } from '@/features/content/locations/domain/model/map/locationEdgeFeature.types';
import { LOCATION_PATH_FEATURE_KIND_META } from '@/features/content/locations/domain/model/map/locationPathFeature.types';
import {
  comparePlacedObjectPaletteCategories,
  getPlacedObjectPaletteOptionsForScale,
} from '@/features/content/locations/domain/model/placedObjects/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type {
  MapDrawPaletteItem,
  MapPaintPaletteFamilyRow,
  MapPaintPaletteItem,
  MapPaintPaletteSection,
  MapPlacePaletteItem,
} from '../types/locationMapEditor.types';

/**
 * Tray section titles (terrain vs interior surfaces).
 * @internal Exported for tests / UI parity with place palette.
 */
export const PAINT_PALETTE_SECTION_LABELS: Record<LocationCellFillCategory, string> = {
  terrain: 'Terrains',
  surface: 'Surfaces',
};

/** Per-family row title in the paint tray (parallel to place “family” rows). */
const PAINT_FAMILY_TRAY_LABELS: Record<LocationCellFillFamily, string> = {
  mountains: 'Mountains',
  plains: 'Plains',
  forest: 'Forest',
  swamp: 'Swamp',
  desert: 'Desert',
  water: 'Water',
  floor: 'Floor',
};

/**
 * Paint palette rows for surface fills — label + swatch from concrete fill meta.
 *
 * @remarks **TODO:** does not yet group/order by fill facets (`category`, `family`, …); policy +
 * flat id list only.
 */
export function getPaintPaletteItemsForScale(scale: LocationScaleId): MapPaintPaletteItem[] {
  const kinds = getAllowedCellFillKindsForScale(scale);
  return kinds.map((fillKind) => {
    const meta = LOCATION_CELL_FILL_KIND_META[fillKind];
    return {
      fillKind,
      label: meta.label,
      description: meta.description,
      swatchColorKey: meta.swatchColorKey,
    };
  });
}

/**
 * Grouped paint palette for the map editor tray: **category** → **family** → concrete fill variants.
 * Uses `LOCATION_CELL_FILL_KIND_META` facets (`category`, `family`); policy still gates which fills appear.
 */
export function getPaintPaletteSectionsForScale(scale: LocationScaleId): MapPaintPaletteSection[] {
  const items = getPaintPaletteItemsForScale(scale);
  const byCategory = new Map<LocationCellFillCategory, Map<LocationCellFillFamily, MapPaintPaletteItem[]>>();

  for (const item of items) {
    const meta = LOCATION_CELL_FILL_KIND_META[item.fillKind];
    const bucket = byCategory.get(meta.category) ?? new Map<LocationCellFillFamily, MapPaintPaletteItem[]>();
    const fam = meta.family;
    const list = bucket.get(fam) ?? [];
    list.push(item);
    bucket.set(fam, list);
    byCategory.set(meta.category, bucket);
  }

  const sortItems = (a: MapPaintPaletteItem, b: MapPaintPaletteItem) => a.label.localeCompare(b.label);

  function buildFamilies(
    bucket: Map<LocationCellFillFamily, MapPaintPaletteItem[]>,
  ): MapPaintPaletteFamilyRow[] {
    const rows: MapPaintPaletteFamilyRow[] = [];
    for (const [familyId, variants] of bucket) {
      const sorted = [...variants].sort(sortItems);
      const defaultFillKind = sorted[0]!.fillKind;
      rows.push({
        familyId,
        label: PAINT_FAMILY_TRAY_LABELS[familyId],
        variants: sorted,
        defaultFillKind,
      });
    }
    rows.sort((a, b) => a.label.localeCompare(b.label));
    return rows;
  }

  const sectionOrder: LocationCellFillCategory[] = ['terrain', 'surface'];
  const out: MapPaintPaletteSection[] = [];
  for (const sectionId of sectionOrder) {
    const bucket = byCategory.get(sectionId);
    if (!bucket || bucket.size === 0) continue;
    out.push({
      sectionId,
      label: PAINT_PALETTE_SECTION_LABELS[sectionId],
      families: buildFamilies(bucket),
    });
  }
  return out;
}

/**
 * Place tool: discrete items only (linked child locations vs local map objects), from policy + meta.
 */
export function getPlacePaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  const options = getPlacedObjectPaletteOptionsForScale(scale);
  const items = options.map((opt) => {
    if (opt.linkedScale) {
      return {
        category: 'linked-content' as const,
        kind: opt.kind,
        familyId: opt.kind,
        variantId: opt.defaultVariantId,
        defaultVariantId: opt.defaultVariantId,
        variantCount: opt.variantCount,
        paletteCategory: opt.paletteCategory,
        label: opt.label,
        description: opt.description,
        iconName: opt.iconName,
        linkedScale: opt.linkedScale,
      };
    }
    return {
      category: 'map-object' as const,
      kind: opt.kind,
      familyId: opt.kind,
      variantId: opt.defaultVariantId,
      defaultVariantId: opt.defaultVariantId,
      variantCount: opt.variantCount,
      paletteCategory: opt.paletteCategory,
      label: opt.label,
      description: opt.description,
      iconName: opt.iconName,
    };
  });
  return [...items].sort((a, b) => {
    const byCat = comparePlacedObjectPaletteCategories(a.paletteCategory, b.paletteCategory);
    if (byCat !== 0) return byCat;
    return a.label.localeCompare(b.label);
  });
}

export function getDrawPathPaletteItemsForScale(scale: LocationScaleId): MapDrawPaletteItem[] {
  const kinds = getAllowedPathKindsForScale(scale);
  return kinds.map((kind) => {
    const meta = LOCATION_PATH_FEATURE_KIND_META[kind];
    return {
      category: 'path' as const,
      kind,
      label: meta.label,
      description: meta.description,
    };
  });
}

/**
 * Edge draw palette — label/description from {@link LOCATION_EDGE_FEATURE_KIND_META} only.
 *
 * @remarks Base `kind` selection only (no per-kind facet UI). If policy ever lists `door`/`window` here again,
 * consider sourcing copy from `AUTHORED_PLACED_OBJECT_DEFINITIONS` to avoid drift with the place tool.
 */
export function getDrawEdgePaletteItemsForScale(scale: LocationScaleId): MapDrawPaletteItem[] {
  const kinds = getAllowedEdgeKindsForScale(scale);
  return kinds.map((kind) => {
    const meta = LOCATION_EDGE_FEATURE_KIND_META[kind];
    return {
      category: 'edge' as const,
      kind,
      label: meta.label,
      description: meta.description,
    };
  });
}

/** Paths then edges — per policy (empty groups omitted at render time). */
export function getGroupedDrawPaletteForScale(scale: LocationScaleId): MapDrawPaletteItem[] {
  return [...getDrawPathPaletteItemsForScale(scale), ...getDrawEdgePaletteItemsForScale(scale)];
}

/** @deprecated Use getPlacePaletteItemsForScale. */
export function getPlaceObjectPaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  return getPlacePaletteItemsForScale(scale);
}

/** @deprecated Use getPlacePaletteItemsForScale. */
export function getGroupedPlacePaletteForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  return getPlacePaletteItemsForScale(scale);
}
