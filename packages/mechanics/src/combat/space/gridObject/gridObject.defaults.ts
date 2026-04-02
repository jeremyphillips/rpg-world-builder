import {
  LOCATION_PLACED_OBJECT_KIND_META,
  type LocationPlacedObjectKindId,
} from '@/features/content/locations/domain/mapContent/locationPlacedObject.types';

import type {
  GridObject,
  GridObjectCoverKind,
  GridObjectPlacementKindKey,
  GridProceduralPlacementKind,
} from '../space.types';

type GridObjectBehaviorFields = Pick<
  GridObject,
  'blocksMovement' | 'blocksLineOfSight' | 'coverKind' | 'isMovable'
>;

/**
 * Stable key for labels and grid VM: authored map kind wins, else procedural.
 */
export function gridObjectPlacementKindKey(o: GridObject): GridObjectPlacementKindKey {
  if (o.authoredPlaceKindId) return o.authoredPlaceKindId
  if (o.proceduralPlacementKind) return o.proceduralPlacementKind
  return 'tree'
}

/**
 * Human-readable name for a placed object (procedural tree/pillar or authored vocabulary).
 */
export function gridObjectPlacementKindDisplayLabel(key: GridObjectPlacementKindKey): string {
  if (key === 'tree' || key === 'pillar') {
    return key === 'tree' ? 'Tree' : 'Pillar'
  }
  return LOCATION_PLACED_OBJECT_KIND_META[key].label
}

export function gridObjectDisplayLabel(o: GridObject): string {
  return gridObjectPlacementKindDisplayLabel(gridObjectPlacementKindKey(o))
}

/** Defaults for encounter bootstrap props (tree / pillar). */
export function defaultsForProceduralKind(kind: GridProceduralPlacementKind): GridObjectBehaviorFields {
  void kind
  return {
    blocksMovement: true,
    blocksLineOfSight: true,
    coverKind: 'none' as GridObjectCoverKind,
    isMovable: false,
  }
}

/**
 * First-pass runtime behavior from authored {@link LocationPlacedObjectKindId}.
 * Refine per-kind when map→combat hydration is wired.
 */
export function defaultsForAuthoredKind(kind: LocationPlacedObjectKindId): GridObjectBehaviorFields {
  switch (kind) {
    case 'table':
      return {
        blocksMovement: false,
        blocksLineOfSight: false,
        coverKind: 'half',
        isMovable: true,
      }
    case 'tree':
      return defaultsForProceduralKind('tree')
    case 'stairs':
    case 'treasure':
    case 'city':
    case 'building':
    case 'site':
    default:
      return {
        blocksMovement: true,
        blocksLineOfSight: true,
        coverKind: 'none',
        isMovable: false,
      }
  }
}
