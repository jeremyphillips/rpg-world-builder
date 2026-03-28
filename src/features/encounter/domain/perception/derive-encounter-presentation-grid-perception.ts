/**
 * Maps encounter **presentation POV** (simulator viewer mode + optional selected combatant) to
 * {@link GridPerceptionInput} for grid / sidebar / header visibility.
 *
 * Does not implement stealth or perception rules — only chooses which combatant id feeds the viewer seam.
 * Action ownership / turn resolution remain tied to {@link EncounterState.activeCombatantId}.
 */
import type { GridPerceptionDebugOverrides, GridPerceptionInput } from '@/features/mechanics/domain/perception/perception.render.projection'
import type { EncounterState } from '@/features/mechanics/domain/encounter'

import type { EncounterSimulatorViewerMode } from '../capabilities/encounter-capabilities.types'

export type DeriveEncounterPresentationGridPerceptionInputArgs = {
  encounterState: EncounterState | null | undefined
  simulatorViewerMode: EncounterSimulatorViewerMode
  /** Active turn combatant (action ownership); used for `active-combatant` mode and fallbacks. */
  activeCombatantId: string | null | undefined
  /**
   * When `simulatorViewerMode === 'selected-combatant'`, preferred viewer combatant.
   * If missing or invalid, falls back to `activeCombatantId` when valid.
   */
  presentationSelectedCombatantId: string | null | undefined
  debugPerceptionOverrides?: GridPerceptionDebugOverrides
}

function combatantExists(state: EncounterState, id: string | null | undefined): id is string {
  return Boolean(id && state.combatantsById[id])
}

/**
 * For DM overview: anchor the perception slice on a real combatant when possible.
 * Prefers active, then presentation selection, then initiative order, then any combatant id.
 */
function resolveDmViewerCombatantId(
  state: EncounterState,
  activeCombatantId: string | null | undefined,
  presentationSelectedCombatantId: string | null | undefined,
): string | null {
  if (combatantExists(state, activeCombatantId)) return activeCombatantId
  if (combatantExists(state, presentationSelectedCombatantId)) return presentationSelectedCombatantId
  for (const id of state.initiativeOrder) {
    if (combatantExists(state, id)) return id
  }
  const first = Object.keys(state.combatantsById)[0]
  return first ?? null
}

/**
 * Returns `undefined` when no valid viewer combatant can be resolved (legacy: no perception overlay).
 */
export function deriveEncounterPresentationGridPerceptionInput(
  args: DeriveEncounterPresentationGridPerceptionInputArgs,
): GridPerceptionInput | undefined {
  const {
    encounterState,
    simulatorViewerMode,
    activeCombatantId,
    presentationSelectedCombatantId,
    debugPerceptionOverrides,
  } = args

  if (!encounterState) return undefined

  const debug = debugPerceptionOverrides

  if (simulatorViewerMode === 'dm') {
    const viewerCombatantId = resolveDmViewerCombatantId(
      encounterState,
      activeCombatantId,
      presentationSelectedCombatantId,
    )
    if (!viewerCombatantId) return undefined
    return { viewerCombatantId, viewerRole: 'dm', debugOverrides: debug }
  }

  if (simulatorViewerMode === 'active-combatant') {
    if (!combatantExists(encounterState, activeCombatantId)) return undefined
    return { viewerCombatantId: activeCombatantId, viewerRole: 'pc', debugOverrides: debug }
  }

  // selected-combatant
  const fromSelection = combatantExists(encounterState, presentationSelectedCombatantId)
    ? presentationSelectedCombatantId
    : null
  const viewerCombatantId =
    fromSelection ?? (combatantExists(encounterState, activeCombatantId) ? activeCombatantId : null)
  if (!viewerCombatantId) return undefined
  return { viewerCombatantId, viewerRole: 'pc', debugOverrides: debug }
}
