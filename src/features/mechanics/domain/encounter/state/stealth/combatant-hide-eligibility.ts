import type {
  CombatantHideEligibilityExtension,
  CombatantInstance,
} from '../types/combatant.types'
import {
  hasAnyHideEligibilityFeatureFlags,
  mergeHideEligibilityFeatureFlagsOr,
  resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime,
} from './hide-eligibility-runtime-sources'

/**
 * Derives hide-extension options from the combatant’s **runtime**: authored snapshot
 * (`stats.skillRuntime.hideEligibilityFeatureFlags`) **OR-merged** with temporary grants from
 * **`activeEffects`** (including nested auras / state payloads — see
 * `hide-eligibility-runtime-sources.ts`) and **`conditions` / `states`** markers.
 *
 * Single resolver for feat/trait **and** spell/marker-driven flags; entry and sustain both consume
 * the output via {@link resolveHideEligibilityForCombatant} in `sight-hide-rules.ts`.
 *
 * **Merge:** union (OR) for each boolean — snapshot or any temporary source can set any of the
 * `CombatantHideEligibilityFeatureFlagsRuntime` fields (half cover, dim light, magical concealment,
 * difficult terrain, high wind, etc.).
 */
export function getCombatantHideEligibilityExtensionOptions(
  combatant: CombatantInstance,
): CombatantHideEligibilityExtension | undefined {
  const snapshot = combatant.stats.skillRuntime?.hideEligibilityFeatureFlags
  const temporary = resolveTemporaryHideEligibilityFeatureFlagsFromCombatantRuntime({
    activeEffects: combatant.activeEffects,
    conditions: combatant.conditions,
    states: combatant.states,
  })
  const merged = mergeHideEligibilityFeatureFlagsOr(snapshot, temporary)
  if (merged == null || !hasAnyHideEligibilityFeatureFlags(merged)) return undefined
  return { featureFlags: { ...merged } }
}
