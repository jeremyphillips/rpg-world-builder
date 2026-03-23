import type { CharacterDetailDto } from '@/features/character/read-model'
import type { MechanicsRules } from '@/shared/types/ruleset'
import { findCharacterSpellcastingClassEntry, getSpellcastingAbility, getSpellSaveDc, getSpellAttackBonus } from '@/features/mechanics/domain/spellcasting'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { resolveProficiencyBonusAtLevel } from '@/features/mechanics/domain/progression'

export { SPELL_USED_PREFIX, buildSpellCombatActions, buildSpellDisplayMeta, buildSpellLogText, formatSpellRange } from './spell-combat-adapter'
export {
  deriveSpellHostility,
  spellHostilityToHostileApplication,
  SPELL_STATE_HOSTILITY,
} from './spell-hostility'
export type { SpellHostilityDerivation } from './spell-hostility'
export { classifySpellResolutionMode, isFullyActionableEffectKind } from './spell-resolution-classifier'
export {
  buildSpellAuditRow,
  collectEffectKinds,
  computeAmbiguousDelivery,
  computeMechanicalSupportLevel,
  computeSpellTargetingAuditFlags,
  spellHasExplicitSaveDc,
  spellHasTopLevelDamageAndSave,
  spellMissingDeliveryMethodAttackCandidate,
  summarizeSpellAudit,
} from './spell-resolution-audit'
export type {
  MechanicalSupportLevel,
  SpellAuditRow,
  SpellAuditSummary,
  SpellTargetingAuditFlags,
} from './spell-resolution-audit'
export {
  buildMonsterAttackEntries,
  buildMonsterExecutableActions,
  buildMonsterEffectLabels,
  buildTurnHooksFromEffects,
  formatEffectLabel,
} from './monster-combat-adapter'
export {
  buildCharacterCombatantInstance,
  buildMonsterCombatantInstance,
  formatRuntimeLabel,
  formatSigned,
  formatAuthoredDamage,
  formatDice,
  toSavingThrowModifier,
} from './combatant-builders'
export { buildSummonAllyMonsterCombatant } from './summon-ally-combatant'

export function getCharacterSpellcastingStats(
  character: CharacterDetailDto,
  ruleset: { mechanics: MechanicsRules },
): {
  spellSaveDc: number
  spellAttackBonus: number
  spellcastingAbilityModifier: number
} {
  const spellcastingClass = findCharacterSpellcastingClassEntry(character)
  const abilityKey = getSpellcastingAbility(character)
  const abilityScore = abilityKey ? character.abilityScores?.[abilityKey] ?? 10 : 10
  const abilityMod = getAbilityModifier(abilityScore)
  const profBonus = resolveProficiencyBonusAtLevel({
    level: spellcastingClass?.level ?? 1,
    ruleset,
  })

  return {
    spellSaveDc: getSpellSaveDc(profBonus, abilityMod),
    spellAttackBonus: getSpellAttackBonus(profBonus, abilityMod),
    spellcastingAbilityModifier: abilityMod,
  }
}
