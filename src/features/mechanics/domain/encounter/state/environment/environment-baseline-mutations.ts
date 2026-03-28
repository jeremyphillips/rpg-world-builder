import { applyEnvironmentBaselinePatch } from '@/features/mechanics/domain/environment/environment.baseline.patch'
import { DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE } from '@/features/mechanics/domain/environment/environment.resolve'
import type { EncounterEnvironmentBaselinePatch } from '@/features/mechanics/domain/environment/environment.types'

import type { EncounterState } from '../types'

/**
 * Updates `environmentBaseline` on encounter state (runtime global environment).
 * Does not log or emit events — callers add log lines if needed.
 *
 * For stealth alignment after baseline changes, use {@link applyEncounterEnvironmentBaselinePatchAndReconcileStealth}
 * in `stealth-rules.ts` (avoids circular imports through the mutations barrel).
 */
export function updateEncounterEnvironmentBaseline(
  state: EncounterState,
  patch: EncounterEnvironmentBaselinePatch,
): EncounterState {
  const current = state.environmentBaseline ?? DEFAULT_ENCOUNTER_ENVIRONMENT_BASELINE
  return {
    ...state,
    environmentBaseline: applyEnvironmentBaselinePatch(current, patch),
  }
}
