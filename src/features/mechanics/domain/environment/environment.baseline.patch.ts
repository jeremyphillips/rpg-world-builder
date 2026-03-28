import type { EncounterEnvironmentBaseline, EncounterEnvironmentBaselinePatch } from './environment.types'

/**
 * Pure merge: shallow overlay of `patch` onto `baseline`. See {@link EncounterEnvironmentBaselinePatch}
 * for semantics (including full replacement of `atmosphereTags` when the patch includes it).
 */
export function applyEnvironmentBaselinePatch(
  baseline: EncounterEnvironmentBaseline,
  patch: EncounterEnvironmentBaselinePatch,
): EncounterEnvironmentBaseline {
  return { ...baseline, ...patch }
}
