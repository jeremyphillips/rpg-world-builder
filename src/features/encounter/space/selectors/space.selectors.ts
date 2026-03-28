import type { CombatActionDefinition } from '@/features/mechanics/domain/encounter'
import { isHostileAction, isValidActionTarget } from '@/features/mechanics/domain/encounter/resolution/action/action-targeting'
import type { EncounterState } from '@/features/mechanics/domain/encounter/state/types'
import { getCombatantDisplayLabel, reconcileBattlefieldEffectAnchors } from '@/features/mechanics/domain/encounter/state'
import type { CombatantPosition, EncounterCell, EncounterSpace, GridObstacleKind } from '../space.types'
import { gridObstacleDisplayName } from '../placement/placeRandomGridObstacle'
import { getCellById, getCellForCombatant, getOccupant, gridDistanceFt, isCellOccupied } from '../space.helpers'
import { hasLineOfSight } from '../sight/space.sight'
import type { CombatantSide } from '@/features/mechanics/domain/encounter/state/types/combatant.types'
import {
  hasBattlefieldPresence,
  isDefeatedCombatant,
} from '@/features/mechanics/domain/encounter/state/combatants/combatant-participation'
import type { BattlefieldSpellContext } from '@/features/mechanics/domain/encounter/state/battlefield/battlefield-spatial-movement-modifiers'
import { getEffectiveGroundMovementBudgetFt } from '@/features/mechanics/domain/encounter/state/battlefield/battlefield-spatial-movement-modifiers'
import { createEmptyTurnContext } from '@/features/mechanics/domain/encounter/state/shared'
import { isAreaGridAction } from '../../helpers/actions'
import type { ViewerCombatantPresentationKind } from '@/features/encounter/domain'
import {
  buildCellPerceptionRenderState,
  buildGridPerceptionSlice,
  mergeGridPerceptionInputCapabilities,
  type EncounterBattlefieldRenderState,
  type EncounterGridCellRenderState,
  type GridPerceptionInput,
} from '@/features/mechanics/domain/perception/perception.render.projection'
import { deriveViewerCombatantPresentationKind } from '../rendering/grid-occupant-render-visibility'

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
  /** True when this cell is within Chebyshev distance of the active combatant for the selected action's `rangeFt` (distance only; not full targeting validity). */
  isWithinSelectedActionRange: boolean
  /** When a creature-targeting action is active (not AoE placement), true iff this occupant is a valid target. */
  isLegalTargetForSelectedAction: boolean
  /** Selected valid hostile target — use for subtle red pulse on token only. */
  isHostileSelectedTargetPulse: boolean
  /** Valid target for a hostile application (offensive) — error-tint emphasis; false for heals/buffs. */
  isHostileLegalTargetForSelectedAction: boolean
  isReachable: boolean
  /** AoE: within spell cast range from caster (valid origin band). */
  aoeCastRange?: boolean
  /** AoE: inside preview or confirmed template from origin/hover center. */
  aoeInTemplate?: boolean
  /** AoE: hovered cell is not a valid origin (out of range or blocked). */
  aoeInvalidOriginHover?: boolean
  /** AoE: confirmed origin cell. */
  aoeOriginLocked?: boolean
  /** Single-cell placement: within cast range (valid origin band). */
  placementCastRange?: boolean
  /** Single-cell placement: hovered cell fails full placement rules. */
  placementInvalidHover?: boolean
  /** Single-cell placement: confirmed chosen cell. */
  placementSelected?: boolean
  /** Persistent attached emanation (e.g. Spirit Guardians) — cell inside the moving aura footprint. */
  persistentAttachedAura?: boolean
  /** Token dimming — `isDefeatedCombatant` when an occupant is present. */
  occupantIsDefeated: boolean
  /** False when a placement exists but the creature is absent from the grid (banished, off-grid, …). */
  occupantRendersToken: boolean
  /**
   * When set from {@link selectGridViewModel} with `perception` opts, false suppresses the normal token
   * under strict POV (`kind !== 'visible'`).
   * Undefined when perception is omitted — grid falls back to legacy “always show” for tokens.
   */
  viewerPerceivesOccupantToken?: boolean
  /** Presentation reason for strict POV + future dim/placeholder/guessed-cell (same seams as token). */
  viewerOccupantPresentationKind?: ViewerCombatantPresentationKind
  /** Viewer-relative render projection (perception layer); undefined when perception opts omitted. */
  perception?: EncounterGridCellRenderState
}

export type GridViewModel = {
  columns: number
  rows: number
  cellFeet: number
  cells: GridCellViewModel[]
  /** Battlefield-level perception presentation + viewer anchor for token self-filter. */
  perception?: {
    battlefieldRender: EncounterBattlefieldRenderState
    viewerCellId: string
    viewerCombatantId: string
  }
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

/**
 * Full validity for single-cell map placement (range, walkable tile, LoS, occupancy).
 */
export function isValidSingleCellPlacementPick(
  space: EncounterSpace,
  placements: CombatantPosition[],
  casterCellId: string,
  targetCellId: string,
  req: { rangeFt: number; lineOfSightRequired: boolean; mustBeUnoccupied: boolean },
): boolean {
  const cell = getCellById(space, targetCellId)
  if (!cell || cell.kind === 'wall' || cell.kind === 'blocking') return false
  const d = gridDistanceFt(space, casterCellId, targetCellId)
  if (d === undefined || d > req.rangeFt) return false
  if (req.lineOfSightRequired && !hasLineOfSight(space, casterCellId, targetCellId)) return false
  if (req.mustBeUnoccupied && getOccupant(placements, targetCellId) !== undefined) return false
  return true
}


/** True when the selected action expects choosing a creature on the grid (not area-origin placement). */
export function actionUsesGridCreatureTargeting(action: CombatActionDefinition | null | undefined): boolean {
  if (!action) return false
  if (isAreaGridAction(action)) return false
  const kind = action.targeting?.kind
  return kind === 'single-target' || kind === 'single-creature' || kind === 'dead-creature'
}

export function selectGridViewModel(
  state: EncounterState,
  opts?: {
    selectedTargetId?: string | null
    selectedActionRangeFt?: number | null
    selectedAction?: CombatActionDefinition | null
    showReachable?: boolean
    aoe?: {
      castRangeFt: number
      areaRadiusFt: number
      casterCellId: string
      hoverCellId: string | null
      originCellId: string | null
      step: 'placing' | 'confirm'
    } | null
    placementPick?: {
      casterCellId: string
      rangeFt: number
      lineOfSightRequired: boolean
      mustBeUnoccupied: boolean
      hoverCellId: string | null
      selectedCellId: string | null
    } | null
    /** Ongoing attached auras (center follows source combatant). */
    persistentAttachedAuras?: Array<{ originCellId: string; areaRadiusFt: number }>
    perception?: GridPerceptionInput
  },
): GridViewModel | undefined {
  const { space, placements } = state
  if (!space || !placements) return undefined

  const perceptionSlice = buildGridPerceptionSlice(state, opts?.perception)

  const cellFeet = space.scale.kind === 'grid' ? space.scale.cellFeet : 5
  const activeId = state.activeCombatantId
  const selectedTargetId = opts?.selectedTargetId ?? null
  const rangeFt = opts?.selectedActionRangeFt ?? null
  const selectedAction = opts?.selectedAction ?? null

  const activeCellId = activeId ? getCellForCombatant(placements, activeId) : undefined

  const reachableSet = opts?.showReachable && activeId
    ? selectCellsWithinDistance(state, activeId)
    : undefined

  const aoe = opts?.aoe
  const placementPick = opts?.placementPick
  const persistentAttachedAuras = opts?.persistentAttachedAuras
  const hoverValid =
    Boolean(
      aoe &&
        aoe.hoverCellId &&
        isValidAoeOriginCell(space, aoe.casterCellId, aoe.hoverCellId, aoe.castRangeFt),
    )
  const invalidHover = Boolean(aoe && aoe.hoverCellId && !hoverValid)

  /**
   * While `step === 'confirm'` with an origin, the AoE footprint stays on that cell — hover does not move it.
   * Unlock: undo, or click the same origin cell again (see route handler).
   */
  const previewCenterId = !aoe
    ? null
    : aoe.step === 'confirm' && aoe.originCellId
      ? aoe.originCellId
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

    let withinSelectedActionRange = false
    if (rangeFt != null && activeCellId) {
      const dist = gridDistanceFt(space, activeCellId, cell.id)
      withinSelectedActionRange = dist !== undefined && dist <= rangeFt
    }

    let isLegalTargetForSelectedAction = false
    let isHostileSelectedTargetPulse = false
    let isHostileLegalTargetForSelectedAction = false
    const aoeActive = Boolean(aoe)
    if (!aoeActive && selectedAction && activeId && occupantId && actionUsesGridCreatureTargeting(selectedAction)) {
      const targetCombatant = combatant
      const actor = state.combatantsById[activeId]
      if (targetCombatant && actor) {
        isLegalTargetForSelectedAction = isValidActionTarget(state, targetCombatant, actor, selectedAction)
        isHostileSelectedTargetPulse = Boolean(
          occupantId === selectedTargetId &&
            isLegalTargetForSelectedAction &&
            isHostileAction(selectedAction),
        )
        isHostileLegalTargetForSelectedAction = Boolean(
          isLegalTargetForSelectedAction && isHostileAction(selectedAction),
        )
      }
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
      if (aoe.step === 'confirm' && aoe.originCellId && cell.id === aoe.originCellId) {
        aoeOriginLocked = true
      }
    }

    if (perceptionSlice?.suppressAoeTemplateOverlay && aoeInTemplate) {
      aoeInTemplate = false
    }

    let placementCastRange: boolean | undefined
    let placementInvalidHover: boolean | undefined
    let placementSelected: boolean | undefined
    if (placementPick) {
      const req = {
        rangeFt: placementPick.rangeFt,
        lineOfSightRequired: placementPick.lineOfSightRequired,
        mustBeUnoccupied: placementPick.mustBeUnoccupied,
      }
      placementCastRange = isValidAoeOriginCell(space, placementPick.casterCellId, cell.id, placementPick.rangeFt)
      placementInvalidHover = Boolean(
        placementPick.hoverCellId === cell.id &&
          !isValidSingleCellPlacementPick(
            space,
            placements,
            placementPick.casterCellId,
            cell.id,
            req,
          ),
      )
      placementSelected = placementPick.selectedCellId === cell.id
    }

    let persistentAttachedAura: boolean | undefined
    if (persistentAttachedAuras?.length) {
      for (const pa of persistentAttachedAuras) {
        const dAura = gridDistanceFt(space, pa.originCellId, cell.id)
        if (dAura !== undefined && dAura <= pa.areaRadiusFt) {
          persistentAttachedAura = true
          break
        }
      }
    }

    let cellPerception: EncounterGridCellRenderState | undefined
    if (perceptionSlice && opts?.perception) {
      cellPerception = buildCellPerceptionRenderState(state, perceptionSlice, cell.id, opts.perception)
    }

    let viewerPerceivesOccupantToken: boolean | undefined
    let viewerOccupantPresentationKind: ViewerCombatantPresentationKind | undefined
    if (opts?.perception && occupantId && combatant && hasBattlefieldPresence(combatant)) {
      const caps = mergeGridPerceptionInputCapabilities(opts.perception)
      viewerOccupantPresentationKind = deriveViewerCombatantPresentationKind(state, {
        viewerCombatantId: opts.perception.viewerCombatantId,
        viewerRole: opts.perception.viewerRole,
        occupantCombatantId: occupantId,
        capabilities: caps,
      })
      viewerPerceivesOccupantToken = viewerOccupantPresentationKind === 'visible'
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
      occupantIsDefeated: combatant ? isDefeatedCombatant(combatant) : false,
      occupantRendersToken: Boolean(
        occupantId && combatant && hasBattlefieldPresence(combatant),
      ),
      ...(viewerPerceivesOccupantToken !== undefined ? { viewerPerceivesOccupantToken } : {}),
      ...(viewerOccupantPresentationKind !== undefined ? { viewerOccupantPresentationKind } : {}),
      obstacleKind,
      obstacleLabel,
      isActive: occupantId !== null && occupantId === activeId,
      isSelectedTarget: occupantId !== null && occupantId === selectedTargetId,
      isWithinSelectedActionRange: withinSelectedActionRange,
      isLegalTargetForSelectedAction,
      isHostileSelectedTargetPulse,
      isHostileLegalTargetForSelectedAction,
      isReachable: reachableSet?.has(cell.id) ?? false,
      ...(aoe
        ? {
            aoeCastRange,
            aoeInTemplate,
            aoeInvalidOriginHover,
            aoeOriginLocked,
          }
        : {}),
      ...(placementPick
        ? {
            placementCastRange,
            placementInvalidHover,
            placementSelected,
          }
        : {}),
      ...(persistentAttachedAura ? { persistentAttachedAura: true } : {}),
      ...(cellPerception ? { perception: cellPerception } : {}),
    }
  })

  return {
    columns: space.width,
    rows: space.height,
    cellFeet,
    cells,
    ...(perceptionSlice
      ? {
          perception: {
            battlefieldRender: perceptionSlice.battlefieldRender,
            viewerCellId: perceptionSlice.viewerCellId,
            viewerCombatantId: perceptionSlice.viewerCombatantId,
          },
        }
      : {}),
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
  return reconcileBattlefieldEffectAnchors({
    ...state,
    placements: [...filtered, { combatantId, cellId }],
  })
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
 * Short rejection label for an illegal move attempt, or `null` when the move would be valid
 * or movement budget is exhausted (caller should not surface status in that case).
 */
export function getMoveRejectionReason(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
): string | null {
  const { space, placements } = state
  if (!space || !placements) return null

  const combatant = state.combatantsById[combatantId]
  if (!combatant) return null

  const movementRemaining = combatant.turnResources?.movementRemaining ?? 0
  if (movementRemaining <= 0) return null

  const cell = getCellById(space, targetCellId)
  if (!cell || !isCellPassable(cell)) return 'Blocked'

  if (isCellOccupied(placements, targetCellId)) return 'Cell occupied'

  const currentCellId = getCellForCombatant(placements, combatantId)
  if (!currentCellId) return null

  const dist = gridDistanceFt(space, currentCellId, targetCellId)
  if (dist === undefined) return null
  if (dist > movementRemaining) return 'Out of range'

  return null
}


/**
 * Move a combatant to a target cell, deducting movement cost.
 * Returns the original state if the move is invalid.
 *
 * When `options` includes `spellLookup`, remaining movement is reconciled against the **current**
 * effective ground speed (attached aura spatial modifiers) using feet spent this turn.
 */
export function moveCombatant(
  state: EncounterState,
  combatantId: string,
  targetCellId: string,
  options?: BattlefieldSpellContext,
): EncounterState {
  if (!canMoveTo(state, combatantId, targetCellId)) return state

  const { space, placements } = state
  const currentCellId = getCellForCombatant(placements!, combatantId)!
  const dist = gridDistanceFt(space!, currentCellId, targetCellId)!

  const combatant = state.combatantsById[combatantId]
  const filteredPlacements = placements!.filter((p) => p.combatantId !== combatantId)
  const placementsNext = [...filteredPlacements, { combatantId, cellId: targetCellId }]

  if (options?.spellLookup) {
    const spent = (combatant.turnContext?.movementSpentThisTurn ?? 0) + dist
    const nextStateBase: EncounterState = {
      ...state,
      placements: placementsNext,
    }
    const effectiveMax = getEffectiveGroundMovementBudgetFt(combatant, nextStateBase, options)
    const updatedCombatant = {
      ...combatant,
      turnContext: {
        ...(combatant.turnContext ?? createEmptyTurnContext()),
        movementSpentThisTurn: spent,
      },
      turnResources: {
        ...combatant.turnResources!,
        movementRemaining: Math.max(0, effectiveMax - spent),
      },
    }
    return {
      ...nextStateBase,
      combatantsById: {
        ...nextStateBase.combatantsById,
        [combatantId]: updatedCombatant,
      },
    }
  }

  const updatedResources = {
    ...combatant.turnResources!,
    movementRemaining: combatant.turnResources!.movementRemaining - dist,
  }

  return {
    ...state,
    combatantsById: {
      ...state.combatantsById,
      [combatantId]: {
        ...combatant,
        turnResources: updatedResources,
      },
    },
    placements: placementsNext,
  }
}
