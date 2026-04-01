import {
  getAllowedCellFillKindsForScale,
  getAllowedEdgeKindsForScale,
  getAllowedPathKindsForScale,
  getAllowedPlacedObjectKindsForScale,
} from '@/features/content/locations/domain/mapContent/locationScaleMapContent.policy';
import { LOCATION_CELL_FILL_KIND_META } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import { LOCATION_EDGE_FEATURE_KIND_META } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import { LOCATION_PATH_FEATURE_KIND_META } from '@/features/content/locations/domain/mapContent/locationPathFeature.types';
import { LOCATION_PLACED_OBJECT_KIND_META } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationScaleId } from '@/shared/domain/locations';

import type {
  MapDrawPaletteItem,
  MapPaintPaletteItem,
  MapPlacePaletteItem,
} from '../types/locationMapEditor.types';

export function getPaintPaletteItemsForScale(scale: LocationScaleId): MapPaintPaletteItem[] {
  const kinds = getAllowedCellFillKindsForScale(scale);
  return kinds.map((fillKind) => {
    const meta = LOCATION_CELL_FILL_KIND_META[fillKind];
    return {
      fillKind,
      label: meta.label,
      description: meta.description,
      iconName: meta.iconName,
      swatchColorKey: meta.swatchColorKey,
    };
  });
}

/**
 * Place tool: discrete items only (linked child locations vs local map objects), from policy + meta.
 */
export function getPlacePaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  const kinds = getAllowedPlacedObjectKindsForScale(scale);
  return kinds.map((kind) => {
    const meta = LOCATION_PLACED_OBJECT_KIND_META[kind];
    const linked = 'linkedScale' in meta ? meta.linkedScale : undefined;
    if (linked) {
      return {
        category: 'linked-content' as const,
        kind,
        label: meta.label,
        description: meta.description,
        iconName: meta.iconName,
        linkedScale: linked,
      };
    }
    return {
      category: 'map-object' as const,
      kind,
      label: meta.label,
      description: meta.description,
      iconName: meta.iconName,
    };
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
