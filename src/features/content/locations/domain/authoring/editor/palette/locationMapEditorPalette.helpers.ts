import {
  AUTHORED_CELL_FILL_DEFINITIONS,
  getAuthoredCellFillFamilyDefinition,
  isCellFillFamilyAllowedOnScale,
  resolveCellFillVariant,
  type LocationCellFillFamilyId,
} from '@/features/content/locations/domain/model/map/locationCellFill.types';
import {
  getAllowedCellFillFamiliesForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
} from '@/features/content/locations/domain/model/policies/locationScaleMapContent.policy';
import type {
  LocationCellFillCategory,
  LocationCellFillFamily,
} from '@/features/content/locations/domain/model/map/locationCellFill.types';
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

const PAINT_FAMILY_TRAY_LABELS: Record<LocationCellFillFamily, string> = {
  mountains: 'Mountains',
  plains: 'Plains',
  forest: 'Forest',
  swamp: 'Swamp',
  desert: 'Desert',
  water: 'Water',
  floor: 'Floor',
};

function familiesForScale(scale: LocationScaleId): LocationCellFillFamilyId[] {
  const allowed = getAllowedCellFillFamiliesForScale(scale);
  return allowed.filter((fid) => isCellFillFamilyAllowedOnScale(fid, scale));
}

/**
 * Flat list of paint variants allowed on this scale (policy ∩ registry `allowedScales`).
 */
export function getPaintPaletteItemsForScale(scale: LocationScaleId): MapPaintPaletteItem[] {
  const rows: MapPaintPaletteItem[] = [];
  for (const familyId of familiesForScale(scale)) {
    const fam = getAuthoredCellFillFamilyDefinition(familyId);
    for (const variantId of Object.keys(fam.variants)) {
      const v = resolveCellFillVariant(familyId, variantId).variant;
      rows.push({
        familyId,
        variantId,
        label: v.label,
        description: v.description,
        swatchColorKey: v.swatchColorKey,
      });
    }
  }
  rows.sort((a, b) => a.label.localeCompare(b.label));
  return rows;
}

/**
 * Grouped paint palette: **category** → **family** → variants.
 */
export function getPaintPaletteSectionsForScale(scale: LocationScaleId): MapPaintPaletteSection[] {
  const byCategory = new Map<LocationCellFillCategory, Map<LocationCellFillFamily, MapPaintPaletteItem[]>>();

  for (const familyId of familiesForScale(scale)) {
    const fam = AUTHORED_CELL_FILL_DEFINITIONS[familyId];
    const cat = fam.category;
    const bucket = byCategory.get(cat) ?? new Map<LocationCellFillFamily, MapPaintPaletteItem[]>();
    const list: MapPaintPaletteItem[] = [];
    for (const variantId of Object.keys(fam.variants)) {
      const v = resolveCellFillVariant(familyId, variantId).variant;
      list.push({
        familyId,
        variantId,
        label: v.label,
        description: v.description,
        swatchColorKey: v.swatchColorKey,
      });
    }
    list.sort((a, b) => a.label.localeCompare(b.label));
    bucket.set(familyId, list);
    byCategory.set(cat, bucket);
  }

  function buildFamilies(
    bucket: Map<LocationCellFillFamily, MapPaintPaletteItem[]>,
  ): MapPaintPaletteFamilyRow[] {
    const rows: MapPaintPaletteFamilyRow[] = [];
    for (const [familyId, variants] of bucket) {
      const fam = getAuthoredCellFillFamilyDefinition(familyId);
      const sorted = [...variants];
      const defaultVariantId = fam.defaultVariantId;
      rows.push({
        familyId,
        label: PAINT_FAMILY_TRAY_LABELS[familyId],
        variants: sorted,
        defaultVariantId,
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
        previewImageUrl: opt.previewImageUrl,
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
      previewImageUrl: opt.previewImageUrl,
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
