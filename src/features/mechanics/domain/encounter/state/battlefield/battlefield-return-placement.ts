import {
  getCellById,
  getCellForCombatant,
  placeCombatant,
  type CombatantPosition,
  type EncounterCell,
  type EncounterSpace,
} from '@/features/encounter/space'

import { ENGINE_STATE_RULES } from '../conditions/condition-rules/engine-state-definitions'
import { updateCombatant } from '../shared'
import type { CombatantInstance, EncounterState } from '../types'

function isPassableCell(
  cell: { kind?: string } | undefined,
): cell is { kind: string; id: string; x: number; y: number } {
  return Boolean(cell && cell.kind !== 'wall' && cell.kind !== 'blocking')
}

/** Engine states whose rules include battlefield absence (banished, off-grid, …). */
export function markerCausesBattlefieldAbsence(markerLabel: string): boolean {
  const rule = ENGINE_STATE_RULES[markerLabel]
  return rule?.consequences.some((c) => c.kind === 'battlefield_absence') ?? false
}

export function combatantHasBattlefieldAbsenceEngineState(c: CombatantInstance): boolean {
  return c.states.some((s) => markerCausesBattlefieldAbsence(s.label))
}

/**
 * Deterministic ring expansion (Chebyshev distance) from `originCellId`.
 * Tie-break: lexical `cell.id` order within each ring.
 * `excludeCombatantId` is omitted from occupancy (returning creature not on grid yet).
 */
export function findNearestUnoccupiedPassableCell(
  space: EncounterSpace,
  placements: CombatantPosition[],
  originCellId: string,
  excludeCombatantId: string,
): string | undefined {
  const origin = getCellById(space, originCellId)
  if (!origin || !isPassableCell(origin)) return undefined

  const occupied = new Set(
    placements.filter((p) => p.combatantId !== excludeCombatantId).map((p) => p.cellId),
  )

  const maxCoord = Math.max(space.width, space.height, 1)
  for (let d = 0; d <= maxCoord; d++) {
    const layer: EncounterCell[] = []
    for (const cell of space.cells) {
      if (!isPassableCell(cell)) continue
      const cheb = Math.max(Math.abs(cell.x - origin.x), Math.abs(cell.y - origin.y))
      if (cheb !== d) continue
      layer.push(cell)
    }
    layer.sort((a, b) => a.id.localeCompare(b.id))
    for (const cell of layer) {
      if (occupied.has(cell.id)) continue
      return cell.id
    }
  }
  return undefined
}

function resolveCellIdForBattlefieldReturn(
  state: EncounterState,
  combatantId: string,
): string | undefined {
  const { space, placements } = state
  if (!space || !placements) return undefined

  const combatant = state.combatantsById[combatantId]
  const preferred = combatant?.battlefieldReturnCellId
  if (!preferred) return undefined

  const preferredCell = getCellById(space, preferred)
  const occupiedByOther = new Set(
    placements.filter((p) => p.combatantId !== combatantId).map((p) => p.cellId),
  )

  if (preferredCell && isPassableCell(preferredCell) && !occupiedByOther.has(preferred)) {
    return preferred
  }

  return findNearestUnoccupiedPassableCell(space, placements, preferred, combatantId)
}

/**
 * Removes grid placement and stores the previous cell for return. No-op when already off-grid.
 */
export function stripPlacementAndRememberReturnCell(
  state: EncounterState,
  combatantId: string,
): EncounterState {
  if (!state.space || !state.placements) return state

  const cellId = getCellForCombatant(state.placements, combatantId)
  if (!cellId) return state

  const placements = state.placements.filter((p) => p.combatantId !== combatantId)
  return updateCombatant({ ...state, placements }, combatantId, (c) => ({
    ...c,
    battlefieldReturnCellId: cellId,
  }))
}

/**
 * After adding a state that causes battlefield absence; clears occupancy and remembers return cell.
 */
export function applyBattlefieldAbsenceOnEngineStateAdded(
  state: EncounterState,
  combatantId: string,
  addedMarkerLabel: string,
): EncounterState {
  if (!markerCausesBattlefieldAbsence(addedMarkerLabel)) return state
  return stripPlacementAndRememberReturnCell(state, combatantId)
}

/**
 * When the combatant no longer has any battlefield-absence engine state and has no placement,
 * place them at the remembered cell or the nearest valid unoccupied cell.
 */
export function maybeRestoreBattlefieldPlacement(state: EncounterState, combatantId: string): EncounterState {
  const combatant = state.combatantsById[combatantId]
  if (!combatant) return state

  if (combatantHasBattlefieldAbsenceEngineState(combatant)) return state

  if (!state.space || !state.placements) return state

  if (getCellForCombatant(state.placements, combatantId)) return state

  const targetCellId = resolveCellIdForBattlefieldReturn(state, combatantId)
  if (!targetCellId) {
    return updateCombatant(state, combatantId, (c) => {
      const { battlefieldReturnCellId: _, ...rest } = c
      return rest
    })
  }

  const next = placeCombatant(state, combatantId, targetCellId)
  if (!next.placements?.some((p) => p.combatantId === combatantId)) {
    return state
  }

  return updateCombatant(next, combatantId, (c) => {
    const { battlefieldReturnCellId: _, ...rest } = c
    return rest
  })
}

/**
 * Run {@link maybeRestoreBattlefieldPlacement} for each combatant id (deduped, stable order).
 * Use when linked markers are removed without `removeStateFromCombatant` — e.g. concentration
 * `dropConcentration` strips states by id; battlefield absence may end and grid return must apply immediately.
 */
export function reconcileBattlefieldPresenceForCombatants(
  state: EncounterState,
  combatantIds: string[],
): EncounterState {
  const unique = [...new Set(combatantIds)].sort((a, b) => a.localeCompare(b))
  let next = state
  for (const id of unique) {
    next = maybeRestoreBattlefieldPlacement(next, id)
  }
  return next
}
