import type { LocationCellFillKindId } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import type { LocationEdgeFeatureKindId } from '@/features/content/locations/domain/mapContent/locationEdgeFeature.types';
import type { LocationPathFeatureKindId } from '@/features/content/locations/domain/mapContent/locationPathFeature.types';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationMapSwatchColorKey } from '@/features/content/locations/domain/mapContent/locationMapSwatchColors.types';
import type { LocationScaleId } from '@/shared/domain/locations';

export type LocationMapEditorMode =
  | 'select'
  | 'place'
  | 'paint'
  | 'clear-fill'
  | 'erase';

export type LocationMapActivePlaceSelection =
  | {
      category: 'object';
      kind: LocationPlacedObjectKindId;
    }
  | {
      category: 'path';
      kind: LocationPathFeatureKindId;
    }
  | {
      category: 'edge';
      kind: LocationEdgeFeatureKindId;
    }
  | null;

export type LocationMapActivePaintSelection = LocationCellFillKindId | null;

/**
 * Pending linked-location modal. Campaign-only locations; cancel leaves draft unchanged.
 */
export type LocationMapPendingPlacement =
  | {
      type: 'linked-location';
      objectKind: LocationPlacedObjectKindId;
      hostScale: LocationScaleId;
      linkedScale: LocationScaleId;
      targetCellId: string;
    }
  | null;

export type MapPaintPaletteItem = {
  fillKind: LocationCellFillKindId;
  label: string;
  description?: string;
  iconName: string;
  swatchColorKey: LocationMapSwatchColorKey;
};

export type MapPlacePaletteItem =
  | {
      category: 'object';
      kind: LocationPlacedObjectKindId;
      label: string;
      description?: string;
      iconName?: string;
      linkedScale?: LocationScaleId;
    }
  | {
      category: 'path';
      kind: LocationPathFeatureKindId;
      label: string;
      description?: string;
    }
  | {
      category: 'edge';
      kind: LocationEdgeFeatureKindId;
      label: string;
      description?: string;
    };
