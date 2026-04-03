/**
 * Combat/runtime defaults for {@link LocationPlacedObjectKindId} — movement, line-of-sight, cover, movability.
 *
 * **Source of truth:** {@link ./locationPlacedObject.registry} — do not duplicate behavior keys elsewhere.
 */

import type { LocationPlacedObjectKindId } from './locationPlacedObject.registry';
import type { LocationPlacedObjectKindRuntimeDefaults } from './locationPlacedObject.registry';
import { getPlacedObjectRuntimeDefaults } from './locationPlacedObject.selectors';

export type { LocationPlacedObjectKindRuntimeDefaults } from './locationPlacedObject.registry';

import { AUTHORED_PLACED_OBJECT_DEFINITIONS } from './locationPlacedObject.registry';
import { LOCATION_PLACED_OBJECT_KIND_IDS } from './locationPlacedObject.selectors';

/** Keyed table for callers that need a stable object reference (prefer {@link resolveLocationPlacedObjectKindRuntimeDefaults}). */
export const LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS = Object.fromEntries(
  LOCATION_PLACED_OBJECT_KIND_IDS.map((id) => [id, AUTHORED_PLACED_OBJECT_DEFINITIONS[id].runtime]),
) as Record<LocationPlacedObjectKindId, LocationPlacedObjectKindRuntimeDefaults>;

/**
 * Single entry point for authored-kind combat/runtime defaults. Prefer this over indexing
 * {@link LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS} ad hoc.
 */
export function resolveLocationPlacedObjectKindRuntimeDefaults(
  kind: LocationPlacedObjectKindId,
): LocationPlacedObjectKindRuntimeDefaults {
  return getPlacedObjectRuntimeDefaults(kind);
}
