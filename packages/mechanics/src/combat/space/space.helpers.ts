import type { EncounterSpace, EncounterCell, CombatantPosition, GridObject } from './space.types'

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

/** Effective floor id for placement when {@link CombatantPosition.floorLocationId} is unset. */
export function placementFloorLocationId(
  p: CombatantPosition,
  space: EncounterSpace,
): string | null {
  if (p.floorLocationId != null && p.floorLocationId !== '') return p.floorLocationId
  return space.locationId ?? null
}

/** Placements whose floor matches the tactical space (see {@link placementFloorLocationId}). */
export function placementsOnSpace(space: EncounterSpace, placements: CombatantPosition[]): CombatantPosition[] {
  const sid = space.locationId ?? null
  if (sid == null) return placements
  return placements.filter((p) => placementFloorLocationId(p, space) === sid)
}

export function getOccupant(
  placements: CombatantPosition[],
  cellId: string,
  space?: EncounterSpace,
): string | undefined {
  const list = space ? placementsOnSpace(space, placements) : placements
  return list.find((p) => p.cellId === cellId)?.combatantId
}

export function getCellForCombatant(
  placements: CombatantPosition[],
  combatantId: string,
  space?: EncounterSpace,
): string | undefined {
  const list = space ? placementsOnSpace(space, placements) : placements
  return list.find((p) => p.combatantId === combatantId)?.cellId
}

export function isCellOccupied(
  placements: CombatantPosition[],
  cellId: string,
  space?: EncounterSpace,
): boolean {
  return getOccupant(placements, cellId, space) !== undefined
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
  const cellA = getCellForCombatant(placements, combatantIdA, space)
  const cellB = getCellForCombatant(placements, combatantIdB, space)
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

// ---------------------------------------------------------------------------
// Grid objects (runtime placed props, authored map only)
// ---------------------------------------------------------------------------

/** Canonical list of placed objects on the space. */
export function getEncounterGridObjects(space: EncounterSpace | undefined): GridObject[] {
  if (!space?.gridObjects?.length) return []
  return space.gridObjects
}

export function findGridObjectAtCell(
  space: EncounterSpace | undefined,
  cellId: string,
): GridObject | undefined {
  return getEncounterGridObjects(space).find((o) => o.cellId === cellId)
}

/** All grid objects whose footprint includes this cell (multi-object support). */
export function findGridObjectsAtCell(
  space: EncounterSpace | undefined,
  cellId: string,
): GridObject[] {
  return getEncounterGridObjects(space).filter((o) => o.cellId === cellId)
}

export function cellHasSightBlockingGridObject(
  space: EncounterSpace | undefined,
  cellId: string,
): boolean {
  return findGridObjectsAtCell(space, cellId).some((o) => o.blocksLineOfSight)
}

export function cellHasMovementBlockingGridObject(
  space: EncounterSpace | undefined,
  cellId: string,
): boolean {
  return findGridObjectsAtCell(space, cellId).some((o) => o.blocksMovement)
}

/**
 * Composed “may a token enter / stand on this cell?” for movement and placement.
 * Combines {@link EncounterCell} wall/blocking kind, `blocksMovement`, and grid objects.
 *
 * `EncounterCell` fields are often **compatibility / denormalized** inputs from legacy or map
 * hydration; first-class `GridObject` and `EncounterEdge` data should align when both exist.
 */
export function cellMovementBlockedForEntering(
  space: EncounterSpace,
  cellId: string,
): boolean {
  const cell = getCellById(space, cellId)
  if (!cell) return true
  if (cell.kind === 'wall' || cell.kind === 'blocking') return true
  if (cell.blocksMovement === true) return true
  return cellHasMovementBlockingGridObject(space, cellId)
}

export function findGridObjectById(
  space: EncounterSpace | undefined,
  objectId: string,
): GridObject | undefined {
  return getEncounterGridObjects(space).find((o) => o.id === objectId)
}

/** Move an existing grid object to another valid cell (e.g. carried object / GM adjustment). Returns a new space, or `null` if the object or target cell is invalid. */
export function moveGridObjectToCell(
  space: EncounterSpace,
  objectId: string,
  cellId: string,
): EncounterSpace | null {
  if (!getCellById(space, cellId)) return null
  const list = space.gridObjects ?? []
  const idx = list.findIndex((o) => o.id === objectId)
  if (idx < 0) return null
  const next = [...list]
  next[idx] = { ...next[idx]!, cellId }
  return { ...space, gridObjects: next }
}
