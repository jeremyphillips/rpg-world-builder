import type { EncounterEnvironmentSetting } from '@/features/mechanics/domain/encounter/environment'

import type { EncounterSpace, GridObstacle, GridObstacleKind } from './space.types'

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

export function gridObstacleDisplayName(kind: GridObstacleKind): string {
  return kind === 'tree' ? 'Tree' : 'Pillar'
}

function newObstacleId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `obs-${crypto.randomUUID()}`
  }
  return `obs-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Places exactly one random obstacle on an open cell. Mutates cell flags to blocking so
 * placement and AoE origin checks stay consistent.
 *
 * Combatant positions are **not** known at typical call time (space is built before
 * `generateInitialPlacements`), so the cell is chosen uniformly among open cells only.
 */
export function placeRandomGridObstacle(
  space: EncounterSpace,
  setting: EncounterEnvironmentSetting,
  rng: () => number = Math.random,
): EncounterSpace {
  const kind = obstacleKindForEnvironment(setting)
  const occupied = new Set((space.obstacles ?? []).map((o) => o.cellId))

  const candidates = space.cells.filter((c) => {
    if (occupied.has(c.id)) return false
    if (c.kind !== 'open' && c.kind != null) return false
    return true
  })

  if (candidates.length === 0) return space

  const pick = candidates[Math.floor(rng() * candidates.length)]!
  const cellId = pick.id

  const obstacle: GridObstacle = {
    id: newObstacleId(),
    kind,
    cellId,
    blocksLineOfSight: true,
    blocksMovement: true,
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
    obstacles: [...(space.obstacles ?? []), obstacle],
  }
}
