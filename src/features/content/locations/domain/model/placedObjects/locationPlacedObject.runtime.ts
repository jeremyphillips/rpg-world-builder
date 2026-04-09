/**
 * Combat/runtime defaults for {@link LocationPlacedObjectKindId} — movement, line-of-sight, tactical combat cover (`combatCoverKind`), movability,
 * plus optional {@link resolveLocationPlacedObjectKindInteraction} for transition/interaction hints.
 *
 * **Source of truth:** {@link ./locationPlacedObject.registry} — do not duplicate behavior keys elsewhere.
 */

import type { AuthoredDoorState } from '@/shared/domain/locations';
import { sanitizeAuthoredDoorState } from '@/shared/domain/locations';

import type {
  AuthoredPlacedObjectInteraction,
  AuthoredPlacedObjectRuntimeFields,
  LocationPlacedObjectKindId,
  LocationPlacedObjectKindRuntimeDefaults,
} from './locationPlacedObject.registry';
import { getPlacedObjectInteraction, getPlacedObjectRuntimeDefaults } from './locationPlacedObject.selectors.core';

export type { LocationPlacedObjectKindRuntimeDefaults } from './locationPlacedObject.registry';

import { AUTHORED_PLACED_OBJECT_DEFINITIONS } from './locationPlacedObject.registry';
import { mapValuesStrict } from './locationPlacedObject.recordUtils';

/** Keyed table for callers that need a stable object reference (prefer {@link resolveLocationPlacedObjectKindRuntimeDefaults}). */
export const LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS = mapValuesStrict(
  AUTHORED_PLACED_OBJECT_DEFINITIONS,
  (d) => d.runtime,
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

/**
 * Effective door family runtime from registry baseline + authored instance {@link AuthoredDoorState}.
 * Open doors do not block movement or line of sight; lock state does not affect blocking in this pass.
 */
export function resolveDoorRuntimeFromState(
  baseRuntime: AuthoredPlacedObjectRuntimeFields,
  doorState: AuthoredDoorState | undefined,
): AuthoredPlacedObjectRuntimeFields {
  const effective = sanitizeAuthoredDoorState(doorState);
  if (effective.openState === 'open') {
    return {
      ...baseRuntime,
      blocksMovement: false,
      blocksLineOfSight: false,
    };
  }
  return baseRuntime;
}

export type { AuthoredPlacedObjectInteraction } from './locationPlacedObject.registry';

/** Optional interaction/transition semantics for combat {@link GridObject} hydration. */
export function resolveLocationPlacedObjectKindInteraction(
  kind: LocationPlacedObjectKindId,
): AuthoredPlacedObjectInteraction | undefined {
  return getPlacedObjectInteraction(kind);
}
