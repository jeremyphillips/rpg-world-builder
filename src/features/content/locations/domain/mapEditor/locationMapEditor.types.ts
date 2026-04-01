import type { LocationCellFillKindId } from '@/features/content/locations/domain/mapContent/locationCellFill.types';
import type { LocationMapEdgeKindId } from '@/shared/domain/locations/map/locationMapEdgeFeature.constants';
import type { LocationMapPathKindId } from '@/shared/domain/locations/map/locationMapPathFeature.constants';
import type { LocationPlacedObjectKindId } from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';
import type { LocationMapSwatchColorKey } from '@/features/content/locations/domain/mapContent/locationMapSwatchColors.types';
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
 */
export type LocationMapActivePlaceSelection =
  | {
      category: 'linked-content';
      kind: LocationPlacedObjectKindId;
    }
  | {
      category: 'map-object';
      kind: LocationPlacedObjectKindId;
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
 * Region metadata lives in draft `regionEntries`; paint state only holds `activeRegionId`.
 * `null` when the editor is not in Paint mode.
 */
export type LocationMapPaintState = {
  domain: 'surface' | 'region';
  surfaceFillKind: LocationCellFillKindId | null;
  /** Must match an id in draft `regionEntries` when painting regions. */
  activeRegionId: string | null;
};

export type LocationMapActivePaintSelection = LocationMapPaintState | null;

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

/** Place palette: linked content vs map objects only (policy + meta). */
export type MapPlacePaletteItem =
  | {
      category: 'linked-content';
      kind: LocationPlacedObjectKindId;
      label: string;
      description?: string;
      iconName?: string;
      linkedScale: LocationScaleId;
    }
  | {
      category: 'map-object';
      kind: LocationPlacedObjectKindId;
      label: string;
      description?: string;
      iconName?: string;
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
