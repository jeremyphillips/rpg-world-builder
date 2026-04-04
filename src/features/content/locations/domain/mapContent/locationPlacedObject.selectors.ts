import type { LocationMapObjectKindId, LocationScaleId } from '@/shared/domain/locations';
import { isValidLocationScaleId } from '@/shared/domain/locations/scale/locationScale.rules';

import {
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  type AuthoredPlacedObjectDefinition,
  type LocationPlacedObjectKindId,
  type LocationPlacedObjectKindRuntimeDefaults,
} from './locationPlacedObject.registry';
import type { LocationMapGlyphIconName, LocationMapObjectIconName } from './locationMapIconNames';
import { LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME } from './locationMapPresentation.constants';
import { mapValuesStrict, recordKeys } from './locationPlacedObject.recordUtils';

/** Stable list of authored placed-object ids — derived from registry keys (no manual mirror). */
export const LOCATION_PLACED_OBJECT_KIND_IDS = recordKeys(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
) as readonly LocationPlacedObjectKindId[];

const PLACED_KIND_ID_SET = new Set<string>(LOCATION_PLACED_OBJECT_KIND_IDS as readonly string[]);

/** Validates and narrows persisted `authoredPlaceKindId` strings for map cell objects. */
export function parseLocationPlacedObjectKindId(raw: string | undefined | null): LocationPlacedObjectKindId | null {
  if (raw == null || typeof raw !== 'string') return null;
  const t = raw.trim();
  return PLACED_KIND_ID_SET.has(t) ? (t as LocationPlacedObjectKindId) : null;
}

export type LocationPlacedObjectKindMeta = {
  label: string;
  description?: string;
  iconName?: LocationMapGlyphIconName;
  linkedScale?: LocationScaleId;
};

function toMeta(d: AuthoredPlacedObjectDefinition): LocationPlacedObjectKindMeta {
  return {
    label: d.label,
    description: d.description,
    iconName: d.iconName,
    ...(d.linkedScale !== undefined ? { linkedScale: d.linkedScale } : {}),
  };
}

/** Display metadata derived from {@link AUTHORED_PLACED_OBJECT_DEFINITIONS}. */
export const LOCATION_PLACED_OBJECT_KIND_META = mapValuesStrict(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  toMeta,
) satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindMeta>;

export function getPlacedObjectDefinition(
  id: LocationPlacedObjectKindId,
): AuthoredPlacedObjectDefinition {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[id];
}

export function getPlacedObjectMeta(id: LocationPlacedObjectKindId): LocationPlacedObjectKindMeta {
  return LOCATION_PLACED_OBJECT_KIND_META[id];
}

export function getPlacedObjectRuntimeDefaults(
  kind: LocationPlacedObjectKindId,
): LocationPlacedObjectKindRuntimeDefaults {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].runtime;
}

export function getPlacedObjectIconName(kind: LocationPlacedObjectKindId): LocationMapGlyphIconName {
  return AUTHORED_PLACED_OBJECT_DEFINITIONS[kind].iconName;
}

/** Persisted map cell object kind → object icon id (separate from authored place-tool glyphs). */
export function getMapObjectKindIconName(kind: LocationMapObjectKindId): LocationMapObjectIconName {
  return LOCATION_MAP_OBJECT_KIND_TO_ICON_NAME[kind];
}

export type PlacedObjectPaletteOption = {
  kind: LocationPlacedObjectKindId;
  label: string;
  description?: string;
  iconName: LocationMapGlyphIconName;
  linkedScale?: LocationScaleId;
};

/** Narrow DTOs for the place palette — derived from registry + `allowedScales` (via {@link getPlacedObjectKindsForScale}). */
export function getPlacedObjectPaletteOptionsForScale(
  scale: LocationScaleId,
): readonly PlacedObjectPaletteOption[] {
  const kinds = getPlacedObjectKindsForScale(scale);
  return kinds.map((kind) => {
    const def = getPlacedObjectDefinition(kind);
    return {
      kind,
      label: def.label,
      description: def.description,
      iconName: def.iconName,
      ...(def.linkedScale !== undefined ? { linkedScale: def.linkedScale } : {}),
    };
  });
}

/** Authored placed kinds allowed on the place palette for this host scale. */
export function getPlacedObjectKindsForScale(scale: LocationScaleId): readonly LocationPlacedObjectKindId[] {
  if (!isValidLocationScaleId(scale)) return [];
  const out: LocationPlacedObjectKindId[] = [];
  for (const id of LOCATION_PLACED_OBJECT_KIND_IDS) {
    const allowed = AUTHORED_PLACED_OBJECT_DEFINITIONS[id].allowedScales as readonly LocationScaleId[];
    if (allowed.includes(scale)) {
      out.push(id);
    }
  }
  return out;
}
