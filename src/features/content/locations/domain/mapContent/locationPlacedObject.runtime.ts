/**
 * Combat/runtime defaults for {@link LocationPlacedObjectKindId} — movement, line-of-sight, cover, movability.
 *
 * **Do not duplicate authored display metadata here.** Labels, descriptions, icons, and `linkedScale` remain
 * the single source of truth in {@link LOCATION_PLACED_OBJECT_KIND_META} (`locationPlacedObject.types.ts`).
 * This module is keyed by the same ids and supplies only grid/combat behavior for hydrating {@link GridObject}
 * when map placement is bridged into encounters.
 */

import type { GridObjectCoverKind } from '@/features/mechanics/domain/combat/space/space.types';

import type { LocationPlacedObjectKindId } from './locationPlacedObject.types';

/**
 * First-pass runtime behavior for an authored placed-object kind. Aligns with {@link GridObject} fields
 * used during combat (no `isStationary`; use `isMovable` and blocking flags).
 */
export type LocationPlacedObjectKindRuntimeDefaults = {
  /** Whether this object blocks moving into its cell (footprint / impassable prop). */
  blocksMovement: boolean;
  /** Whether this object blocks binary line-of-sight through its cell for this object. */
  blocksLineOfSight: boolean;
  coverKind: GridObjectCoverKind;
  /** Whether combat rules may reposition this object (e.g. shove); not edge/wall structure. */
  isMovable: boolean;
};

/**
 * Canonical keyed table for {@link resolveLocationPlacedObjectKindRuntimeDefaults}.
 * Do not read from this object directly in new code — use the resolver so lookup stays centralized.
 */
export const LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS = {
  city: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
  building: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
  site: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
  tree: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
  table: {
    blocksMovement: false,
    blocksLineOfSight: false,
    coverKind: 'half',
    isMovable: true,
  },
  stairs: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
  treasure: {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none',
    isMovable: false,
  },
} as const satisfies Record<LocationPlacedObjectKindId, LocationPlacedObjectKindRuntimeDefaults>;

/**
 * Single entry point for authored-kind combat/runtime defaults. All hydration paths should use this (or
 * `buildGridObjectFromAuthoredPlacedObject` in `packages/mechanics/.../gridObject.fromAuthored.ts`) instead of indexing
 * {@link LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS} ad hoc.
 */
export function resolveLocationPlacedObjectKindRuntimeDefaults(
  kind: LocationPlacedObjectKindId,
): LocationPlacedObjectKindRuntimeDefaults {
  return LOCATION_PLACED_OBJECT_KIND_RUNTIME_DEFAULTS[kind];
}
