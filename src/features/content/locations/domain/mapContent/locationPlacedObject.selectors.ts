import type { LocationScaleId } from '@/shared/domain/locations';
import { isValidLocationScaleId } from '@/shared/domain/locations/scale/locationScale.rules';

import {
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  type AuthoredPlacedObjectDefinition,
  type LocationPlacedObjectKindId,
  type LocationPlacedObjectKindRuntimeDefaults,
} from './locationPlacedObject.registry';
import type { LocationMapIconName } from './locationMapIconNames';

/** Stable tuple of authored placed-object ids (matches registry keys). */
export const LOCATION_PLACED_OBJECT_KIND_IDS = [
  'city',
  'building',
  'site',
  'tree',
  'table',
  'stairs',
  'treasure',
] as const satisfies readonly LocationPlacedObjectKindId[];

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
  iconName?: LocationMapIconName;
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
export const LOCATION_PLACED_OBJECT_KIND_META = {
  city: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.city),
  building: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.building),
  site: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.site),
  tree: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.tree),
  table: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.table),
  stairs: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.stairs),
  treasure: toMeta(AUTHORED_PLACED_OBJECT_DEFINITIONS.treasure),
} as const satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindMeta>;

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
