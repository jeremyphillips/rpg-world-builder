/**
 * Authoritative multi-space encounter support (mechanics layer).
 *
 * - `EncounterState.spacesById` holds every tactical {@link EncounterSpace} currently in play.
 * - Each {@link CombatantPosition} may set `encounterSpaceId` to pin the token to one of those spaces.
 * - `EncounterState.space` remains **transitional** — synced to the active combatant’s space for legacy call sites.
 *
 * Viewer-local `sceneFocus` (client) stays separate: it chooses **which** space a given client renders;
 * this module is about **authoritative** split-party positions.
 *
 * TODO: Cross-space line-of-sight, pathfinding, and generalized transitions are out of scope here.
 */

import type { EncounterState } from '../state/types'
import type { CombatantPosition, EncounterSpace } from './space.types'

/** All tactical spaces in play, falling back to legacy single `state.space`. */
export function getSpacesRegistry(state: EncounterState): Record<string, EncounterSpace> {
  if (state.spacesById && Object.keys(state.spacesById).length > 0) {
    return state.spacesById
  }
  if (state.space) {
    return { [state.space.id]: state.space }
  }
  return {}
}

/**
 * Resolves which `EncounterSpace.id` this placement occupies.
 * Prefers explicit `encounterSpaceId`; otherwise infers from floor + registry or legacy single space.
 */
export function resolvePlacementEncounterSpaceId(state: EncounterState, p: CombatantPosition): string | undefined {
  if (p.encounterSpaceId != null && p.encounterSpaceId !== '') {
    return p.encounterSpaceId
  }
  const reg = state.spacesById
  const singleSpace = state.space
  if (singleSpace && (!reg || Object.keys(reg).length <= 1)) {
    return singleSpace.id
  }
  if (reg && p.floorLocationId != null) {
    const match = Object.values(reg).find((s) => (s.locationId ?? null) === (p.floorLocationId ?? null))
    if (match) return match.id
  }
  return singleSpace?.id
}

export function getEncounterSpaceById(state: EncounterState, id: string): EncounterSpace | undefined {
  return getSpacesRegistry(state)[id]
}

/** Authoritative tactical space for a combatant (movement, reachability, targeting on that grid). */
export function getEncounterSpaceForCombatant(state: EncounterState, combatantId: string): EncounterSpace | undefined {
  const p = state.placements?.find((x) => x.combatantId === combatantId)
  if (!p) return state.space
  const id = resolvePlacementEncounterSpaceId(state, p)
  if (!id) return state.space
  return getEncounterSpaceById(state, id) ?? state.space
}

/** Merge spaces into `spacesById` (stair traversal, future scene loads). */
export function mergeSpacesIntoRegistry(state: EncounterState, ...spaces: EncounterSpace[]): Record<string, EncounterSpace> {
  const base = { ...getSpacesRegistry(state) }
  for (const s of spaces) {
    base[s.id] = s
  }
  return base
}

/**
 * Keeps transitional `EncounterState.space` aligned with the active combatant’s authoritative space.
 * Call after turn changes (and after stair traversal) so single-space-biased helpers see the correct grid.
 */
export function syncEncounterSpaceToActiveCombatant(state: EncounterState): EncounterState {
  const aid = state.activeCombatantId
  if (!aid || !state.placements?.length) return state
  const space = getEncounterSpaceForCombatant(state, aid)
  if (!space) return state
  return { ...state, space }
}
