import type { EncounterEnvironmentSetting } from '@/features/mechanics/domain/environment'

import { defaultsForProceduralKind } from '../gridObject/gridObject.defaults'
import type { EncounterSpace, GridObstacleKind, GridObject } from '../space.types'

/**
 * Maps encounter environment to obstacle art / semantics for procedural placement.
 * `mixed` and `other` use **pillar** as a neutral interior default until we have richer rules.
 */
export function obstacleKindForEnvironment(setting: EncounterEnvironmentSetting): GridObstacleKind {
  switch (setting) {
    case 'outdoors':
      return 'tree'
    case 'indoors':
      return 'pillar'
    case 'mixed':
    case 'other':
    default:
      return 'pillar'
  }
}

/**
 * @deprecated Use {@link gridObjectPlacementKindDisplayLabel} from `gridObject/gridObject.defaults` or {@link gridObjectDisplayLabel}.
 */
export function gridObstacleDisplayName(kind: GridObstacleKind): string {
  return kind === 'tree' ? 'Tree' : 'Pillar'
}

function newGridObjectId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `obs-${crypto.randomUUID()}`
  }
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Places exactly one random procedural object on an open cell. Mutates cell flags to blocking so
 * placement and AoE origin checks stay consistent.
 *
 * Combatant positions are **not** known at typical call time (space is built before
 * `generateInitialPlacements`), so the cell is chosen uniformly among open cells only.
 */
export function placeRandomGridObject(
  space: EncounterSpace,
  setting: EncounterEnvironmentSetting,
  rng: () => number = Math.random,
): EncounterSpace {
  const proceduralPlacementKind = obstacleKindForEnvironment(setting)
  const occupied = new Set(getOccupiedCellIds(space))

  const candidates = space.cells.filter((c) => {
    if (occupied.has(c.id)) return false
    if (c.kind !== 'open' && c.kind != null) return false
    return true
  })

  if (candidates.length === 0) return space

  const pick = candidates[Math.floor(rng() * candidates.length)]!
  const cellId = pick.id

  const behavior = defaultsForProceduralKind(proceduralPlacementKind)
  const obj: GridObject = {
    id: newGridObjectId(),
    cellId,
    proceduralPlacementKind,
    ...behavior,
  }

  const cells = space.cells.map((c) => {
    if (c.id !== cellId) return c
    return {
      ...c,
      kind: 'blocking' as const,
      blocksMovement: true,
      blocksSight: true,
      blocksProjectiles: true,
    }
  })

  return {
    ...space,
    cells,
    gridObjects: [...(space.gridObjects ?? []), obj],
  }
}

function getOccupiedCellIds(space: EncounterSpace): string[] {
  const fromGrid = (space.gridObjects ?? []).map((o) => o.cellId)
  const fromLegacy = (space.obstacles ?? []).map((o) => o.cellId)
  return [...fromGrid, ...fromLegacy]
}

/**
 * @deprecated Use {@link placeRandomGridObject} and other runtime grid-object placement helpers. Do not add new call sites.
 */
export function placeRandomGridObstacle(
  space: EncounterSpace,
  setting: EncounterEnvironmentSetting,
  rng: () => number = Math.random,
): EncounterSpace {
  return placeRandomGridObject(space, setting, rng)
}
