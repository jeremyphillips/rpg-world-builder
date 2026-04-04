/**
 * **Movement reachability** (walking on the tactical grid): king-adjacency BFS with per-step
 * legality. This is **not** line-of-sight: do not substitute {@link hasLineOfSight} or supercover
 * rays for movement.
 *
 * **Contract for callers**
 * - **Single step:** use only {@link movementStepLegal} (never raw edge checks for diagonals).
 * - **Shortest path cost / existence:** {@link minMovementCostFtToCell}.
 * - **All cells within budget:** {@link cellsReachableWithinMovementBudget}.
 *
 * **Diagonal rule (plain English):** a diagonal step is allowed only if **at least one** of the two
 * orthogonal two-step routes `from → orth1 → to` or `from → orth2 → to` is fully legal (each leg
 * passes terrain + edge movement rules; intermediate cell not occupied by another token). This is
 * **not** a coarse “either/both edge from `from`” shortcut — each full decomposition must work.
 *
 * **Source-of-truth layers (transitional):** blocking is composed from {@link EncounterCell} flags
 * (compatibility / denormalized in some flows), {@link EncounterSpace.gridObjects}, and
 * {@link EncounterSpace.edges}. Prefer composed helpers in `space.helpers` / `edgeCrossing` over
 * ad hoc flag reads.
 */
import {
  getCellAt,
  getCellById,
  cellMovementBlockedForEntering,
  getOccupant,
} from '../space.helpers'
import { orthogonalMovementEdgeBlocked } from './edgeCrossing'
import type { CombatantPosition, EncounterSpace } from '../space.types'
import type { EncounterState } from '../../state/types'

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
  space: EncounterSpace,
  placements: CombatantPosition[],
  cellId: string,
  movingCombatantId: string,
  state?: EncounterState,
): boolean {
  const occ = getOccupant(placements, cellId, space, state)
  return occ !== undefined && occ !== movingCombatantId
}

/** One orthogonal step: enter `to`, cross edge from→to (no occupancy — BFS handles destination). */
function orthogonalMovementStepLegal(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
): boolean {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return false
  if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) !== 1) return false
  if (cellMovementBlockedForEntering(space, toCellId)) return false
  return !orthogonalMovementEdgeBlocked(space, fromCellId, toCellId)
}

/**
 * Diagonal step is legal iff **at least one** orthogonal decomposition is fully legal:
 * `from → orth1 → to` or `from → orth2 → to`, where each leg is a legal orthogonal step and
 * the intermediate cell is not occupied by another combatant.
 */
function diagonalMovementStepLegal(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
  placements: CombatantPosition[],
  movingCombatantId: string,
  state?: EncounterState,
): boolean {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return false
  if (Math.abs(from.x - to.x) !== 1 || Math.abs(from.y - to.y) !== 1) return false
  if (cellMovementBlockedForEntering(space, toCellId)) return false

  const orth1 = getCellAt(space, to.x, from.y)
  const orth2 = getCellAt(space, from.x, to.y)
  if (!orth1 || !orth2) return false

  const pathA =
    orthogonalMovementStepLegal(space, fromCellId, orth1.id) &&
    !isOccupiedByOther(space, placements, orth1.id, movingCombatantId, state) &&
    orthogonalMovementStepLegal(space, orth1.id, toCellId)

  const pathB =
    orthogonalMovementStepLegal(space, fromCellId, orth2.id) &&
    !isOccupiedByOther(space, placements, orth2.id, movingCombatantId, state) &&
    orthogonalMovementStepLegal(space, orth2.id, toCellId)

  return pathA || pathB
}

/**
 * One king-move step: orthogonal uses edge + destination terrain; diagonal uses full orthogonal
 * decomposition (see {@link diagonalMovementStepLegal}).
 */
export function movementStepLegal(
  space: EncounterSpace,
  fromCellId: string,
  toCellId: string,
  placements: CombatantPosition[],
  movingCombatantId: string,
  state?: EncounterState,
): boolean {
  const from = getCellById(space, fromCellId)
  const to = getCellById(space, toCellId)
  if (!from || !to) return false
  const dx = Math.abs(from.x - to.x)
  const dy = Math.abs(from.y - to.y)
  if (dx === 0 && dy === 0) return false
  if (dx > 1 || dy > 1) return false
  if (dx + dy === 1) {
    return orthogonalMovementStepLegal(space, fromCellId, toCellId)
  }
  return diagonalMovementStepLegal(space, fromCellId, toCellId, placements, movingCombatantId, state)
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
  state?: EncounterState,
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
        if (!movementStepLegal(space, id, next.id, placements, movingCombatantId, state)) continue
        if (isOccupiedByOther(space, placements, next.id, movingCombatantId, state)) continue
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
  state?: EncounterState,
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
        if (!movementStepLegal(space, id, next.id, placements, movingCombatantId, state)) continue
        if (isOccupiedByOther(space, placements, next.id, movingCombatantId, state)) continue
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
