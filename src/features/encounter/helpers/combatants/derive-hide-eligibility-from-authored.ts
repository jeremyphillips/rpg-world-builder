import type { CharacterDetailDto } from '@/features/character/read-model'
import type { CombatantHideEligibilityFeatureFlagsRuntime } from '@/features/mechanics/domain/encounter/state/types/combatant.types'
import { featGrantsAllowHalfCoverForHide } from '@/features/mechanics/domain/encounter/state/stealth/hide-eligibility-feat-sources'

/**
 * Maps authored character **feats** (detail DTO) into `skillRuntime.hideEligibilityFeatureFlags`.
 * Used only by `buildCharacterCombatantInstance` — hide rules still read combatant runtime only.
 */
export function deriveHideEligibilityFeatureFlagsFromCharacterDetail(
  character: CharacterDetailDto,
): CombatantHideEligibilityFeatureFlagsRuntime | undefined {
  const ids = character.feats?.map((f) => f.id) ?? []
  const allowHalfCoverForHide = ids.some((id) => featGrantsAllowHalfCoverForHide(id))
  if (!allowHalfCoverForHide) return undefined
  return { allowHalfCoverForHide: true }
}
