import type { LocationCellFillKindId } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationMapSwatchColorKey } from '@/features/content/locations/domain/mapContent/locationMapSwatchColors.types';
import type { LocationScaleId } from '@/shared/domain/locations';

export type LocationMapEditorMode = 'select' | 'place' | 'paint' | 'clear-fill';

export type LocationMapActivePlaceSelection =
  | {
      category: 'object';
      kind: LocationPlacedObjectKindId;
    }
  | null;

export type LocationMapActivePaintSelection = LocationCellFillKindId | null;

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

export type MapPlacePaletteItem = {
  category: 'object';
  kind: LocationPlacedObjectKindId;
  label: string;
  description?: string;
  iconName?: string;
  linkedScale?: LocationScaleId;
};
