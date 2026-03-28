import type { EncounterSimulatorViewerMode } from '../capabilities/encounter-capabilities.types'
import type { GridViewModel } from '../../space/selectors/space.selectors'

/**
 * Lightweight copy for the encounter header — derived from grid perception + simulator mode only.
 */
export type EncounterPerceptionUiFeedback = {
  /** Primary POV line (always set when the header shows an active combatant). */
  povLine: string
  /** Present when active-combatant POV and battlefield blind veil is active (magical darkness). */
  magicalDarknessLine: string | null
  /** Tooltip / helper: why tokens, obstacles, or templates may be hidden. */
  visibilityHint: string | null
}

export type DeriveEncounterPerceptionUiFeedbackArgs = {
  simulatorViewerMode: EncounterSimulatorViewerMode
  /** Label for the combatant whose POV the grid uses (may differ from the active combatant). */
  presentationViewerDisplayLabel: string | null
  gridPerception: GridViewModel['perception'] | undefined
}

/**
 * Maps simulator POV + {@link GridViewModel.perception} to header strings.
 * Does not re-derive rules — uses `battlefieldRender.useBlindVeil` from the projection layer.
 */
export function deriveEncounterPerceptionUiFeedback(
  args: DeriveEncounterPerceptionUiFeedbackArgs,
): EncounterPerceptionUiFeedback {
  const { simulatorViewerMode, presentationViewerDisplayLabel, gridPerception } = args
  const label = (presentationViewerDisplayLabel?.trim() || 'Active combatant').trim()

  if (simulatorViewerMode === 'dm') {
    return {
      povLine: 'Battlefield: DM overview (full visibility)',
      magicalDarknessLine: null,
      visibilityHint: null,
    }
  }

  const povLine = `Viewing as: ${label}`
  const blindVeil = gridPerception?.battlefieldRender.useBlindVeil === true

  if (!blindVeil) {
    return {
      povLine,
      magicalDarknessLine: null,
      visibilityHint: null,
    }
  }

  return {
    povLine,
    magicalDarknessLine: 'Inside magical darkness — restricted sight',
    visibilityHint:
      'Only your cell stays fully readable. Other occupants and obstacles may be hidden; area or darkness boundaries may be suppressed while you are inside this effect.',
  }
}
