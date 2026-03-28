import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'
import { abilityKeyToId } from '@/features/mechanics/domain/character/abilities/abilities.utils'
import type { AbilityKey, AbilityScoreMap } from '@/features/mechanics/domain/character'
import { resolveProficiencyContribution } from '@/features/mechanics/domain/progression'

import type { CombatantInstance } from '../types/combatant.types'

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
 * 1. Explicit runtime override: `stats.skillRuntime.passivePerception`, then legacy `stats.passivePerception`
 * 2. Skill-derived (when `proficiencyBonus` is a positive number): `10 + Wis mod + (PB × perceptionProficiencyLevel)`
 * 3. Fallback: `10 + Wisdom modifier`
 *
 * Future: a precomputed Perception skill modifier (before passive conversion) can slot between (1) and (2)
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
 * 1. Explicit override: `stats.skillRuntime.stealthCheckModifierOverride` when set
 * 2. Proficiency-based: Dex mod + `(PB × stealthProficiencyLevel)` when `proficiencyBonus` is a positive number
 * 3. Fallback: Dexterity modifier only
 *
 * Future: item / flat Stealth bonuses can extend step 2 or insert before the override when modeled on the snapshot.
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
