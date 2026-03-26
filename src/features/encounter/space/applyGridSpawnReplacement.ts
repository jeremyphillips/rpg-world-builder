import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'
import type { CombatantPosition, EncounterCell, EncounterSpace } from './space.types'
import { getCellById, getCellForCombatant, gridDistanceFt } from './space.helpers'

function isCellPassable(cell: EncounterCell): boolean {
  return cell.kind !== 'wall' && cell.kind !== 'blocking'
}

function occupiedCells(placements: CombatantPosition[]): Set<string> {
  return new Set(placements.map((p) => p.cellId))
}

/**
 * Picks passable, unoccupied cells nearest to `anchorCellId` (Chebyshev distance via
 * {@link gridDistanceFt}), tie-broken by `cell.id` for stability.
 */
function pickNearestOpenCellIds(
  space: EncounterSpace,
  placements: CombatantPosition[],
  anchorCellId: string,
  count: number,
): string[] {
  if (count <= 0) return []

  const occ = occupiedCells(placements)
  const anchor = getCellById(space, anchorCellId)
  if (!anchor) return []

  const scored = space.cells
    .filter((cell) => isCellPassable(cell) && !occ.has(cell.id))
    .map((cell) => {
      const d = gridDistanceFt(space, anchorCellId, cell.id)
      return { cellId: cell.id, d: d ?? Number.POSITIVE_INFINITY }
    })
    .sort((a, b) => (a.d !== b.d ? a.d - b.d : a.cellId.localeCompare(b.cellId)))

  return scored.slice(0, count).map((s) => s.cellId)
}

/**
 * When a spawn effect adds new combatants that **replace** an existing combatant's on-grid token
 * (e.g. corpse → minion via `mapMonsterIdFromTargetRemains`, or future shapeshift / transformation
 * flows that introduce a new combatant instance in the same tactical space), transfer canonical
 * placement: remove the source from `placements`, assign the first spawned id to the source's
 * cell, and assign any additional spawned ids to the nearest passable empty cells (no stacking).
 */
export function applyGridSpawnReplacementFromTarget(
  state: EncounterState,
  sourceCombatantId: string,
  spawnedCombatantIds: string[],
): EncounterState {
  const { space, placements } = state
  if (!space || !placements || spawnedCombatantIds.length === 0) return state

  const anchorCellId = getCellForCombatant(placements, sourceCombatantId)
  if (!anchorCellId) return state

  let next: CombatantPosition[] = placements.filter(
    (p) => p.combatantId !== sourceCombatantId && !spawnedCombatantIds.includes(p.combatantId),
  )

  const [first, ...rest] = spawnedCombatantIds
  if (!first) return state

  next = [...next, { combatantId: first, cellId: anchorCellId }]

  if (rest.length > 0) {
    const extraCells = pickNearestOpenCellIds(space, next, anchorCellId, rest.length)
    for (let i = 0; i < rest.length; i++) {
      const cellId = extraCells[i]
      const sid = rest[i]!
      if (cellId) {
        next = [...next, { combatantId: sid, cellId }]
      }
    }
  }

  return { ...state, placements: next }
}
