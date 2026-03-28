import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'

import type { CombatantInstance } from './types/combatant.types'

/**
 * Passive Wisdom (Perception): 10 + Wisdom modifier, plus proficiency when modeled on the combatant.
 * If {@link CombatantInstance.stats.passivePerception} is set (e.g. from monster senses), that value wins.
 *
 * TODO: Add Perception skill proficiency / expertise from character sheet or monster skills when available.
 */
export function getPassivePerceptionScore(combatant: CombatantInstance): number {
  if (typeof combatant.stats.passivePerception === 'number') {
    return combatant.stats.passivePerception
  }
  const wis = combatant.stats.abilityScores?.wisdom ?? 10
  return 10 + getAbilityModifier(wis)
}

/**
 * Stealth check modifier for Dexterity (Stealth) — Dexterity modifier only until skill proficiencies
 * are threaded onto combatants.
 *
 * TODO: proficiency in Stealth, expertise, item bonuses.
 */
export function getStealthCheckModifier(combatant: CombatantInstance): number {
  const dex = combatant.stats.dexterityScore ?? combatant.stats.abilityScores?.dexterity ?? 10
  return getAbilityModifier(dex)
}
