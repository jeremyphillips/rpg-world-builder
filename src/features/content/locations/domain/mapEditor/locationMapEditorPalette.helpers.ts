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

import type { MapPaintPaletteItem, MapPlacePaletteItem } from './locationMapEditor.types';

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

export function getPlaceObjectPaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  const kinds = getAllowedPlacedObjectKindsForScale(scale);
  return kinds.map((kind) => {
    const meta = LOCATION_PLACED_OBJECT_KIND_META[kind];
    return {
      category: 'object' as const,
      kind,
      label: meta.label,
      description: meta.description,
      iconName: meta.iconName,
      linkedScale: meta.linkedScale,
    };
  });
}

export function getPlacePathPaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
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

export function getPlaceEdgePaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
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

/** Objects, then paths, then edges — per policy (empty sections omitted at render time). */
export function getGroupedPlacePaletteForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  return [
    ...getPlaceObjectPaletteItemsForScale(scale),
    ...getPlacePathPaletteItemsForScale(scale),
    ...getPlaceEdgePaletteItemsForScale(scale),
  ];
}

/** @deprecated Use getGroupedPlacePaletteForScale or getPlaceObjectPaletteItemsForScale. */
export function getPlacePaletteItemsForScale(scale: LocationScaleId): MapPlacePaletteItem[] {
  return getGroupedPlacePaletteForScale(scale);
}
