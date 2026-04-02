import type { GridPerceptionDebugOverrides } from '@/features/mechanics/domain/perception/perception.render.projection'
import type { EncounterState } from '@/features/mechanics/domain/combat'

/** Client policy types for encounter UI. See `docs/reference/combat/client/encounter-viewer-permissions.md` for summary and post-build follow-ups. */

/**
 * Session seat / operator role for permission policy (distinct from grid `GridPerceptionInput.viewerRole` dm|pc).
 * Simulator uses `dm` as the single full-control convention.
 */
export type EncounterSessionSeat = 'dm' | 'player' | 'observer'

/**
 * @deprecated Use {@link EncounterSessionSeat}. Kept briefly for external imports; prefer `EncounterSessionSeat`.
 */
export type EncounterViewerRole = EncounterSessionSeat

/**
 * Who the tactical grid “camera” follows for perception/render (simulator POV).
 * Distinct from {@link EncounterSessionSeat} (session tools vs turn ownership) and from turn/action ownership
 * (`activeCombatantId`).
 */
export type EncounterSimulatorViewerMode = 'active-combatant' | 'selected-combatant' | 'dm'

export type EncounterViewerContext = {
  /** Encounter surface: simulator sandbox vs live session policy. */
  mode: 'simulator' | 'session'
  /**
   * Session seat / operator role. In `simulator` mode, use `dm` for full sandbox control.
   */
  viewerRole: EncounterSessionSeat
  /** Optional account id (e.g. auth user) for debugging / future server parity. */
  viewerUserId?: string | null
  /**
   * Presentation POV for grid/sidebar/header visibility (not who resolves actions).
   * Maps to `GridPerceptionInput.viewerRole`: `active-combatant` / `selected-combatant` → `pc`, `dm` → `dm`.
   */
  simulatorViewerMode: EncounterSimulatorViewerMode
  /**
   * When `simulatorViewerMode === 'selected-combatant'`, which combatant to view as.
   * If unset or invalid, presentation derivation falls back to the active combatant.
   */
  presentationSelectedCombatantId?: string | null
  /** Centralized debug flags for the perception pipeline (not scattered in components). */
  debugPerceptionOverrides?: GridPerceptionDebugOverrides
  /**
   * Combatants this viewer may act for in **session** mode; ignored for capability derivation when `mode === 'simulator'`.
   */
  controlledCombatantIds: string[]
}

export type EncounterCapabilities = {
  canMoveActiveCombatant: boolean
  canSelectAction: boolean
  canResolveAction: boolean
  canEndTurn: boolean
  canInspectHiddenInfo: boolean
  canOpenDmTools: boolean
  canViewEnemyIntent: boolean
  canAnnotateBattlefield: boolean
  tonePerspective: 'self' | 'observer' | 'dm'
}

export function deriveEncounterCapabilities(
  encounter: EncounterState,
  viewer: EncounterViewerContext,
): EncounterCapabilities {
  if (viewer.mode === 'simulator') {
    return {
      canMoveActiveCombatant: true,
      canSelectAction: true,
      canResolveAction: true,
      canEndTurn: true,
      canInspectHiddenInfo: true,
      canOpenDmTools: true,
      canViewEnemyIntent: true,
      canAnnotateBattlefield: true,
      tonePerspective: 'dm',
    }
  }

  const isDmSeat = viewer.viewerRole === 'dm'
  const controlsActive =
    encounter.activeCombatantId !== null &&
    viewer.controlledCombatantIds.includes(encounter.activeCombatantId)

  return {
    canMoveActiveCombatant: controlsActive,
    canSelectAction: controlsActive,
    canResolveAction: controlsActive,
    canEndTurn: controlsActive,
    canInspectHiddenInfo: isDmSeat,
    canOpenDmTools: isDmSeat,
    canViewEnemyIntent: isDmSeat,
    canAnnotateBattlefield: isDmSeat,
    tonePerspective: isDmSeat ? 'dm' : controlsActive ? 'self' : 'observer',
  }
}
