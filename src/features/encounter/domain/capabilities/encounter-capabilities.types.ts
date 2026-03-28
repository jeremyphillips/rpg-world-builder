import type { GridPerceptionDebugOverrides } from '@/features/mechanics/domain/encounter/environment/perception.render.projection'
import type { EncounterState } from '@/features/mechanics/domain/encounter'

export type EncounterViewerRole = 'dm' | 'pc'

/**
 * Who the tactical grid “camera” follows for perception/render (simulator POV).
 * Distinct from {@link EncounterViewerRole} (session/DM tools vs player UI).
 */
export type EncounterSimulatorViewerMode = 'active-combatant' | 'dm'

export type EncounterViewerContext = {
  /** Session role: DM tools, hidden info, etc. */
  viewerRole: EncounterViewerRole
  /**
   * Perception source: active turn combatant’s POV (`active-combatant`) or omniscient debug (`dm`).
   * Maps to `GridPerceptionInput.viewerRole`: `active-combatant` → `pc`, `dm` → `dm`.
   */
  simulatorViewerMode: EncounterSimulatorViewerMode
  /** Centralized debug flags for the perception pipeline (not scattered in components). */
  debugPerceptionOverrides?: GridPerceptionDebugOverrides
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
  const isDm = viewer.viewerRole === 'dm'
  const controlsActive =
    encounter.activeCombatantId !== null &&
    viewer.controlledCombatantIds.includes(encounter.activeCombatantId)

  return {
    canMoveActiveCombatant: controlsActive || isDm,
    canSelectAction: controlsActive || isDm,
    canResolveAction: controlsActive || isDm,
    canEndTurn: controlsActive || isDm,
    canInspectHiddenInfo: isDm,
    canOpenDmTools: isDm,
    canViewEnemyIntent: isDm,
    canAnnotateBattlefield: isDm,
    tonePerspective: isDm ? 'dm' : controlsActive ? 'self' : 'observer',
  }
}
