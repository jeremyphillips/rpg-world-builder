import type { EncounterState } from '@/features/mechanics/domain/encounter'

export type EncounterViewerRole = 'dm' | 'pc'

export type EncounterViewerContext = {
  viewerRole: EncounterViewerRole
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
