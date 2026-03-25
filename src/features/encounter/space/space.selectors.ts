import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'
import { getCombatantDisplayLabel } from '@/features/mechanics/domain/encounter/state'
import type { EncounterCell, GridObstacleKind } from './space.types'
import { gridObstacleDisplayName } from './placeRandomGridObstacle'
import { getCellById, getCellForCombatant, getOccupant, gridDistanceFt, isCellOccupied } from './space.helpers'
import type { CombatantSide } from '@/features/mechanics/domain/encounter/state/types/combatant.types'

// ---------------------------------------------------------------------------
// State-level selectors
// ---------------------------------------------------------------------------

export function selectCombatantCell(
  state: EncounterState,
  combatantId: string,
): EncounterCell | undefined {
  if (!state.space || !state.placements) return undefined
  const cellId = getCellForCombatant(state.placements, combatantId)
  if (!cellId) return undefined
  return getCellById(state.space, cellId)
}

export function selectDistanceBetween(
  state: EncounterState,
  idA: string,
  idB: string,
): number | undefined {
  if (!state.space || !state.placements) return undefined
  const cellA = getCellForCombatant(state.placements, idA)
  const cellB = getCellForCombatant(state.placements, idB)
  if (!cellA || !cellB) return undefined
  return gridDistanceFt(state.space, cellA, cellB)
}

export function selectIsTargetInRange(
  state: EncounterState,
  actorId: string,
  targetId: string,
  rangeFt: number,
): boolean {
  const dist = selectDistanceBetween(state, actorId, targetId)
  if (dist === undefined) return true
  return dist <= rangeFt
}

/** Combatants whose occupied cell is within Chebyshev `areaRadiusFt` of `originCellId`. */
export function selectCombatantIdsInAoeFootprint(
  state: EncounterState,
  originCellId: string,
  areaRadiusFt: number,
): string[] {
  if (!state.space || !state.placements) return []
  const out: string[] = []
  for (const p of state.placements) {
    const d = gridDistanceFt(state.space, originCellId, p.cellId)
    if (d !== undefined && d <= areaRadiusFt) out.push(p.combatantId)
  }
  return out
}

// ---------------------------------------------------------------------------
// Grid view model
// ---------------------------------------------------------------------------

export type GridCellViewModel = {
  cellId: string
  x: number
  y: number
  kind: NonNullable<EncounterCell['kind']>
  occupantId: string | null
  occupantLabel: string | null
  occupantSide: CombatantSide | null
  /** From `CombatantInstance.portraitImageKey` — resolve URLs in UI only. */
  occupantPortraitImageKey: string | null
  /** Obstruction on this cell (from `EncounterSpace.obstacles`), for labels / tooltips. */
  obstacleKind: GridObstacleKind | null
  obstacleLabel: string | null
  isActive: boolean
  isSelectedTarget: boolean
  isInRange: boolean
  isReachable: boolean
  /** AoE: within spell cast range from caster (valid origin band). */
  aoeCastRange?: boolean
  /** AoE: inside preview or confirmed template from origin/hover center. */
  aoeInTemplate?: boolean
  /** AoE: hovered cell is not a valid origin (out of range or blocked). */
  aoeInvalidOriginHover?: boolean
  /** AoE: confirmed origin cell. */
  aoeOriginLocked?: boolean
}

export type GridViewModel = {
  columns: number
  rows: number
  cellFeet: number
  cells: GridCellViewModel[]
}

export function isValidAoeOriginCell(
  space: EncounterState['space'],
  casterCellId: string,
  originCellId: string,
  castRangeFt: number,
): boolean {
  if (!space) return false
  const cell = getCellById(space, originCellId)
  if (!cell || cell.kind === 'wall' || cell.kind === 'blocking') return false
  const d = gridDistanceFt(space, casterCellId, originCellId)
  return d !== undefined && d <= castRangeFt
}

export function selectGridViewModel(
  state: EncounterState,
  opts?: {
    selectedTargetId?: string | null
    selectedActionRangeFt?: number | null
    showReachable?: boolean
    aoe?: {
      castRangeFt: number
      areaRadiusFt: number
      casterCellId: string
      hoverCellId: string | null
      originCellId: string | null
      step: 'placing' | 'confirm'
    } | null
  },
): GridViewModel | undefined {
  const { space, placements } = state
  if (!space || !placements) return undefined

  const cellFeet = space.scale.kind === 'grid' ? space.scale.cellFeet : 5
  const activeId = state.activeCombatantId
  const selectedTargetId = opts?.selectedTargetId ?? null
  const rangeFt = opts?.selectedActionRangeFt ?? null

  const activeCellId = activeId ? getCellForCombatant(placements, activeId) : undefined

  const reachableSet = opts?.showReachable && activeId
    ? selectCellsWithinDistance(state, activeId)
    : undefined

  const aoe = opts?.aoe
  const hoverValid =
    Boolean(
      aoe &&
        aoe.hoverCellId &&
        isValidAoeOriginCell(space, aoe.casterCellId, aoe.hoverCellId, aoe.castRangeFt),
    )
  const invalidHover = Boolean(aoe && aoe.hoverCellId && !hoverValid)

  /** Valid hover previews first (including while origin is locked); else locked origin; else none. */
  const previewCenterId = !aoe
    ? null
    : invalidHover
      ? aoe.originCellId ?? null
      : hoverValid
        ? aoe.hoverCellId!
        : aoe.originCellId ?? null

  const obstacleByCellId = new Map<string, GridObstacleKind>()
  for (const o of space.obstacles ?? []) {
    obstacleByCellId.set(o.cellId, o.kind)
  }

  const combatantRoster = Object.values(state.combatantsById)

  const cells: GridCellViewModel[] = space.cells.map((cell) => {
    const occupantId = getOccupant(placements, cell.id) ?? null
    const combatant = occupantId ? state.combatantsById[occupantId] ?? null : null
    const obstacleKind = obstacleByCellId.get(cell.id) ?? null
    const obstacleLabel = obstacleKind != null ? gridObstacleDisplayName(obstacleKind) : null

    let inRange = false
    if (rangeFt != null && activeCellId) {
      const dist = gridDistanceFt(space, activeCellId, cell.id)
      inRange = dist !== undefined && dist <= rangeFt
    }

    let aoeCastRange: boolean | undefined
    let aoeInTemplate: boolean | undefined
    let aoeInvalidOriginHover: boolean | undefined
    let aoeOriginLocked: boolean | undefined

    if (aoe && activeCellId) {
      const dist = gridDistanceFt(space, aoe.casterCellId, cell.id)
      aoeCastRange = dist !== undefined && dist <= aoe.castRangeFt
      if (previewCenterId) {
        const dArea = gridDistanceFt(space, previewCenterId, cell.id)
        aoeInTemplate = dArea !== undefined && dArea <= aoe.areaRadiusFt
      }
      if (invalidHover && cell.id === aoe.hoverCellId) {
        aoeInvalidOriginHover = true
      }
      if (
        aoe.step === 'confirm' &&
        aoe.originCellId &&
        cell.id === aoe.originCellId &&
        !(hoverValid && aoe.hoverCellId !== aoe.originCellId)
      ) {
        aoeOriginLocked = true
      }
    }

    return {
      cellId: cell.id,
      x: cell.x,
      y: cell.y,
      kind: cell.kind ?? 'open',
      occupantId,
      occupantLabel: combatant ? getCombatantDisplayLabel(combatant, combatantRoster) : null,
      occupantSide: combatant?.side ?? null,
      occupantPortraitImageKey: combatant?.portraitImageKey ?? null,
      obstacleKind,
      obstacleLabel,
      isActive: occupantId !== null && occupantId === activeId,
      isSelectedTarget: occupantId !== null && occupantId === selectedTargetId,
      isInRange: inRange,
      isReachable: reachableSet?.has(cell.id) ?? false,
      ...(aoe
        ? {
            aoeCastRange,
            aoeInTemplate,
            aoeInvalidOriginHover,
            aoeOriginLocked,
          }
        : {}),
    }
  })

  return {
    columns: space.width,
    rows: space.height,
    cellFeet,
    cells,
  }
}

// ---------------------------------------------------------------------------
// Placement mutation
// ---------------------------------------------------------------------------

/**
 * Place or move a combatant to a specific cell. Returns a new state with updated placements.
 * Validates the cell exists and is not a wall/blocking cell.
 */
export function placeCombatant(
  state: EncounterState,
  combatantId: string,
  cellId: string,
): EncounterState {
  if (!state.space || !state.placements) return state

  const cell = getCellById(state.space, cellId)
  if (!cell) return state
  if (cell.kind === 'wall' || cell.kind === 'blocking') return state

  const filtered = state.placements.filter((p) => p.combatantId !== combatantId)
  return {
    ...state,
    placements: [...filtered, { combatantId, cellId }],
  }
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

function isCellPassable(cell: EncounterCell): boolean {
  return cell.kind !== 'wall' && cell.kind !== 'blocking'
}

/**
 * Geometric (Chebyshev) cells within `movementRemaining` distance.
 * Does NOT account for walls, terrain costs, or pathing -- purely metric.
 * Sufficient for generated open grids.
 */
export function selectCellsWithinDistance(
  state: EncounterState,
  combatantId: string,
): Set<string> {
  const result = new Set<string>()
  const { space, placements } = state
  if (!space || !placements) return result

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return result

  const movementRemaining = combatant.turnResources?.movementRemaining ?? 0
  if (movementRemaining <= 0) return result

  const currentCellId = getCellForCombatant(placements, combatantId)
  if (!currentCellId) return result

  for (const cell of space.cells) {
    if (cell.id === currentCellId) continue
    if (!isCellPassable(cell)) continue
    if (isCellOccupied(placements, cell.id)) continue

    const dist = gridDistanceFt(space, currentCellId, cell.id)
    if (dist !== undefined && dist <= movementRemaining) {
      result.add(cell.id)
    }
  }

  return result
}

/**
 * Single predicate: can the combatant move to the target cell?
 * Checks distance, movement remaining, cell validity, and occupancy.
 */
export function canMoveTo(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
): boolean {
  const { space, placements } = state
  if (!space || !placements) return false

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return false

  const movementRemaining = combatant.turnResources?.movementRemaining ?? 0
  if (movementRemaining <= 0) return false

  const cell = getCellById(space, targetCellId)
  if (!cell || !isCellPassable(cell)) return false
  if (isCellOccupied(placements, targetCellId)) return false

  const currentCellId = getCellForCombatant(placements, combatantId)
  if (!currentCellId) return false

  const dist = gridDistanceFt(space, currentCellId, targetCellId)
  if (dist === undefined) return false

  return dist <= movementRemaining
}

/**
 * Move a combatant to a target cell, deducting movement cost.
 * Returns the original state if the move is invalid.
 */
export function moveCombatant(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
): EncounterState {
  if (!canMoveTo(state, combatantId, targetCellId)) return state

  const { space, placements } = state
  const currentCellId = getCellForCombatant(placements!, combatantId)!
  const dist = gridDistanceFt(space!, currentCellId, targetCellId)!

  const combatant = state.combatantsById[combatantId]
  const updatedResources = {
    ...combatant.turnResources!,
    movementRemaining: combatant.turnResources!.movementRemaining - dist,
  }

  const updatedCombatant = {
    ...combatant,
    turnResources: updatedResources,
  }

  const filteredPlacements = placements!.filter((p) => p.combatantId !== combatantId)

  return {
    ...state,
    combatantsById: {
      ...state.combatantsById,
      [combatantId]: updatedCombatant,
    },
    placements: [...filteredPlacements, { combatantId, cellId: targetCellId }],
  }
}
