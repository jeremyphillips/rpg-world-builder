import type { EncounterToastViewerInput, NormalizedToastViewerContext } from './encounter-toast-types'

/**
 * Single place for simulator vs session branching. Session policies consume
 * {@link NormalizedToastViewerContext} only — no `mode === 'simulator'` checks downstream.
 */
export function normalizeToastViewerContext(input: EncounterToastViewerInput): NormalizedToastViewerContext {
  if (input.viewerMode === 'simulator') {
    return { mode: 'simulator' }
  }
  return {
    mode: 'session',
    controlledCombatantIds: input.controlledCombatantIds,
    tonePerspective: input.tonePerspective,
  }
}
