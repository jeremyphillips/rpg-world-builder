import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'
import { abilityKeyToId } from '@/features/mechanics/domain/character/abilities/abilities.utils'
import type { AbilityKey, AbilityScoreMap } from '@/features/mechanics/domain/character'
import { resolveProficiencyContribution } from '@/features/mechanics/domain/progression'

import type { CombatantInstance } from './types/combatant.types'

/**
 * Merge encounter `abilityScores` with legacy `dexterityScore` (Dex only when `dex` / `dexterity` absent),
 * then read through {@link getAbilityScoreValue} so short ids (`dex`) and full keys (`dexterity`) match engine rules.
 */
function combatantAbilityScoreMapForLookup(
  stats: CombatantInstance['stats'],
): AbilityScoreMap | undefined {
  const base = stats.abilityScores
  if (base == null && stats.dexterityScore == null) return undefined

  const merged = { ...(base ?? {}) } as AbilityScoreMap
  const hasDex =
    typeof merged.dexterity === 'number' || typeof merged.dex === 'number'
  if (!hasDex && typeof stats.dexterityScore === 'number') {
    merged.dexterity = stats.dexterityScore as AbilityScoreMap['dexterity']
  }
  return merged
}

export function getCombatantAbilityScore(stats: CombatantInstance['stats'], key: AbilityKey): number {
  const map = combatantAbilityScoreMapForLookup(stats)
  return getAbilityScoreValue(map, abilityKeyToId(key))
}

/**
 * Passive Perception — precedence (see tests):
 * 1. `stats.skillRuntime.passivePerception` (preferred runtime seam)
 * 2. `stats.passivePerception` (legacy / hand-built combatants)
 * 3. Skill-derived: `10 + Wisdom modifier + (proficiencyBonus × perceptionProficiencyLevel)` when `proficiencyBonus` is a positive number
 * 4. Fallback: `10 + Wisdom modifier`
 *
 * Future: flat Perception skill modifier before passive conversion can slot in as another layer before step 3
 * without changing call sites.
 */
export function getPassivePerceptionScore(combatant: CombatantInstance): number {
  const sr = combatant.stats.skillRuntime
  if (typeof sr?.passivePerception === 'number') {
    return sr.passivePerception
  }
  if (typeof combatant.stats.passivePerception === 'number') {
    return combatant.stats.passivePerception
  }

  const wis = getCombatantAbilityScore(combatant.stats, 'wisdom')
  const wisMod = getAbilityModifier(wis)
  const pb = sr?.proficiencyBonus
  const level = sr?.perceptionProficiencyLevel ?? 0

  if (typeof pb === 'number' && pb > 0) {
    return 10 + wisMod + resolveProficiencyContribution(pb, level)
  }
  return 10 + wisMod
}

/**
 * Stealth check modifier — precedence:
 * 1. `stats.skillRuntime.stealthCheckModifierOverride` when set
 * 2. Dexterity modifier + `(proficiencyBonus × stealthProficiencyLevel)` when `proficiencyBonus` is a positive number
 * 3. Dexterity modifier only
 *
 * Future: item bonuses and flat skill modifiers can extend step 2 or add a precomputed branch before override.
 */
export function getStealthCheckModifier(combatant: CombatantInstance): number {
  const sr = combatant.stats.skillRuntime
  if (typeof sr?.stealthCheckModifierOverride === 'number') {
    return sr.stealthCheckModifierOverride
  }

  const dex = getCombatantAbilityScore(combatant.stats, 'dexterity')
  const dexMod = getAbilityModifier(dex)
  const pb = sr?.proficiencyBonus
  const level = sr?.stealthProficiencyLevel ?? 0

  if (typeof pb === 'number' && pb > 0) {
    return dexMod + resolveProficiencyContribution(pb, level)
  }
  return dexMod
}
