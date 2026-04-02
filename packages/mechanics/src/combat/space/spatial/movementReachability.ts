import { getCellAt, getCellById, cellMovementBlockedForEntering, getOccupant } from '../space.helpers'
import { segmentMovementBlocked } from './edgeCrossing'
import type { CombatantPosition, EncounterSpace } from '../space.types'

const NEIGHBOR_DELTAS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

function cellFeet(space: EncounterSpace): number {
  return space.scale.kind === 'grid' ? space.scale.cellFeet : 5
}

function isOccupiedByOther(
  placements: CombatantPosition[],
  cellId: string,
  movingCombatantId: string,
): boolean {
  const occ = getOccupant(placements, cellId)
  return occ !== undefined && occ !== movingCombatantId
}

/**
 * One king-move step: entering `toCellId` must be allowed, and the segment from → to must not
 * be blocked for movement (orthogonal edge or diagonal corner rule — see {@link segmentMovementBlocked}).
 */
export function movementStepLegal(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): boolean {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return false
  const dx = Math.abs(from.x - to.x)
  const dy = Math.abs(from.y - to.y)
  if (dx === 0 && dy === 0) return false
  if (dx > 1 || dy > 1) return false
  if (cellMovementBlockedForEntering(space, toCellId)) return false
  if (segmentMovementBlocked(space, fromCellId, toCellId)) return false
  return true
}

/**
 * Shortest movement cost (feet) from `startCellId` to `targetCellId` using 8-way adjacency and
 * {@link movementStepLegal} on each step. Does not cap by a budget — returns `undefined` if there
 * is no route (blocked cells/edges, or occupied cells other than the mover’s start square block passage).
 */
export function minMovementCostFtToCell(
  space: EncounterSpace,
  startCellId: string,
  targetCellId: string,
  placements: CombatantPosition[],
  movingCombatantId: string,
): number | undefined {
  if (startCellId === targetCellId) return 0

  const cf = cellFeet(space)
  let frontier = [startCellId]
  const visited = new Set<string>([startCellId])
  let hops = 0

  while (frontier.length) {
    const nextFrontier: string[] = []
    for (const id of frontier) {
      const cell = getCellById(space, id)
      if (!cell) continue
      for (const [dx, dy] of NEIGHBOR_DELTAS) {
        const next = getCellAt(space, cell.x + dx, cell.y + dy)
        if (!next) continue
        if (visited.has(next.id)) continue
        if (!movementStepLegal(space, id, next.id)) continue
        if (isOccupiedByOther(placements, next.id, movingCombatantId)) continue
        if (next.id === targetCellId) return (hops + 1) * cf
        visited.add(next.id)
        nextFrontier.push(next.id)
      }
    }
    hops++
    frontier = nextFrontier
  }
  return undefined
}

/**
 * All cells reachable within `budgetFt` using legal steps (same rules as {@link minMovementCostFtToCell}),
 * excluding `startCellId`. Does not include cells occupied by others.
 */
export function cellsReachableWithinMovementBudget(
  space: EncounterSpace,
  startCellId: string,
  budgetFt: number,
  placements: CombatantPosition[],
  movingCombatantId: string,
): Set<string> {
  const out = new Set<string>()
  if (budgetFt <= 0) return out

  const cf = cellFeet(space)
  let frontier = [startCellId]
  const visited = new Set<string>([startCellId])
  let hops = 0

  while (frontier.length) {
    const nextFrontier: string[] = []
    for (const id of frontier) {
      const cell = getCellById(space, id)
      if (!cell) continue
      for (const [dx, dy] of NEIGHBOR_DELTAS) {
        const next = getCellAt(space, cell.x + dx, cell.y + dy)
        if (!next) continue
        if (visited.has(next.id)) continue
        if (!movementStepLegal(space, id, next.id)) continue
        if (isOccupiedByOther(placements, next.id, movingCombatantId)) continue
        const nextCost = (hops + 1) * cf
        if (nextCost > budgetFt) continue
        visited.add(next.id)
        out.add(next.id)
        nextFrontier.push(next.id)
      }
    }
    hops++
    frontier = nextFrontier
  }
  return out
}
