import type { CombatantInstance } from '@/features/mechanics/domain/encounter/state'
import type { EncounterSpace, CombatantPosition, InitialPlacementOptions } from '../space.types'
import { getCellAt, isCellOccupied } from '../space.helpers'

type Side = NonNullable<InitialPlacementOptions['allySide']>

function sideColumns(side: Side, width: number): number[] {
  switch (side) {
    case 'left': return [0, 1]
    case 'right': return [width - 1, width - 2]
    case 'top':
    case 'bottom': return Array.from({ length: width }, (_, i) => i)
  }
}

function sideRows(side: Side, height: number): number[] {
  switch (side) {
    case 'left':
    case 'right': return Array.from({ length: height }, (_, i) => i)
    case 'top': return [0, 1]
    case 'bottom': return [height - 1, height - 2]
  }
}

function getCandidateCells(side: Side, width: number, height: number): Array<{ x: number; y: number }> {
  const cols = sideColumns(side, width)
  const rows = sideRows(side, height)
  const candidates: Array<{ x: number; y: number }> = []

  for (const y of rows) {
    for (const x of cols) {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        candidates.push({ x, y })
      }
    }
  }

  return candidates
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Place combatants onto a grid space, allies on one side, enemies on the other.
 * Falls back to any open cell when the designated side is full.
 */
export function generateInitialPlacements(
  space: EncounterSpace,
  combatants: CombatantInstance[],
  opts?: InitialPlacementOptions,
): CombatantPosition[] {
  const allySide: Side = opts?.allySide ?? 'left'
  const enemySide: Side = opts?.enemySide ?? 'right'
  const randomize = opts?.randomizeWithinSide ?? false

  const allies = combatants.filter((c) => c.side === 'party')
  const enemies = combatants.filter((c) => c.side === 'enemies')
  const placements: CombatantPosition[] = []

  function placeGroup(group: CombatantInstance[], side: Side): void {
    let candidates = getCandidateCells(side, space.width, space.height)
    if (randomize) candidates = shuffle(candidates)

    for (const combatant of group) {
      const slot = candidates.find((coord) => {
        const cell = getCellAt(space, coord.x, coord.y)
        if (!cell || cell.kind === 'wall' || cell.kind === 'blocking') return false
        return !isCellOccupied(placements, cell.id)
      })

      if (slot) {
        placements.push({ combatantId: combatant.instanceId, cellId: `c-${slot.x}-${slot.y}` })
      }
    }
  }

  placeGroup(allies, allySide)
  placeGroup(enemies, enemySide)

  return placements
}
