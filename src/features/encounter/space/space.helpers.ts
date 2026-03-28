import type { EncounterSpace, EncounterCell, CombatantPosition, GridObstacle } from './space.types'

// ---------------------------------------------------------------------------
// Cell lookups
// ---------------------------------------------------------------------------

export function getCellAt(
  space: EncounterSpace,
  x: number,
  y: number,
): EncounterCell | undefined {
  return space.cells.find((c) => c.x === x && c.y === y)
}

export function getCellById(
  space: EncounterSpace,
  cellId: string,
): EncounterCell | undefined {
  return space.cells.find((c) => c.id === cellId)
}

// ---------------------------------------------------------------------------
// Occupancy
// ---------------------------------------------------------------------------

export function getOccupant(
  placements: CombatantPosition[],
  cellId: string,
): string | undefined {
  return placements.find((p) => p.cellId === cellId)?.combatantId
}

export function getCellForCombatant(
  placements: CombatantPosition[],
  combatantId: string,
): string | undefined {
  return placements.find((p) => p.combatantId === combatantId)?.cellId
}

export function isCellOccupied(
  placements: CombatantPosition[],
  cellId: string,
): boolean {
  return placements.some((p) => p.cellId === cellId)
}

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

function getCellFeet(space: EncounterSpace): number {
  return space.scale.kind === 'grid' ? space.scale.cellFeet : 5
}

/**
 * Chebyshev (king-move) grid distance in feet.
 * Diagonal movement costs the same as orthogonal (standard 5e grid rule).
 */
export function gridDistanceFt(
  space: EncounterSpace,
  cellIdA: string,
  cellIdB: string,
): number | undefined {
  const a = getCellById(space, cellIdA)
  const b = getCellById(space, cellIdB)
  if (!a || !b) return undefined

  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  return Math.max(dx, dy) * getCellFeet(space)
}

/**
 * Whether two combatants are within `rangeFt` of each other.
 * Returns `true` when spatial data is missing (backwards-compatible).
 */
export function isWithinRange(
  space: EncounterSpace,
  placements: CombatantPosition[],
  combatantIdA: string,
  combatantIdB: string,
  rangeFt: number,
): boolean {
  const cellA = getCellForCombatant(placements, combatantIdA)
  const cellB = getCellForCombatant(placements, combatantIdB)
  if (!cellA || !cellB) return true

  const dist = gridDistanceFt(space, cellA, cellB)
  if (dist === undefined) return true

  return dist <= rangeFt
}

/**
 * Human-readable grid label (column letter + 1-based row), e.g. `C7` for x=2, y=6.
 */
export function formatGridCellLabel(space: EncounterSpace, cellId: string): string {
  const cell = getCellById(space, cellId)
  if (!cell) return cellId
  if (cell.x >= 26) return cellId
  const col = String.fromCharCode(65 + cell.x)
  return `${col}${cell.y + 1}`
}

/** First obstacle whose footprint is this cell (e.g. tree / pillar from {@link EncounterSpace.obstacles}). */
export function findGridObstacleAtCell(
  space: EncounterSpace | undefined,
  cellId: string,
): GridObstacle | undefined {
  return space?.obstacles?.find((o) => o.cellId === cellId)
}

export function findGridObstacleById(
  space: EncounterSpace | undefined,
  objectId: string,
): GridObstacle | undefined {
  return space?.obstacles?.find((o) => o.id === objectId)
}

/** Move an existing grid obstacle to another valid cell (e.g. carried object / GM adjustment). Returns a new space, or `null` if the obstacle or target cell is invalid. */
export function moveGridObstacleToCell(
  space: EncounterSpace,
  obstacleId: string,
  cellId: string,
): EncounterSpace | null {
  if (!getCellById(space, cellId)) return null
  const obstacles = space.obstacles ?? []
  const idx = obstacles.findIndex((o) => o.id === obstacleId)
  if (idx < 0) return null
  const nextObs = [...obstacles]
  nextObs[idx] = { ...nextObs[idx]!, cellId }
  return { ...space, obstacles: nextObs }
}
