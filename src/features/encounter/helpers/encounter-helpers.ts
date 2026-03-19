import type { CharacterDetailDto } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import type { MechanicsRules } from '@/shared/types/ruleset'
import { findCharacterSpellcastingClassEntry, getSpellcastingAbility, getSpellSaveDc, getSpellAttackBonus } from '@/features/mechanics/domain/spellcasting'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import { resolveProficiencyBonusAtLevel } from '@/features/mechanics/domain/progression'

export { SPELL_USED_PREFIX, buildSpellCombatActions, buildSpellDisplayMeta, buildSpellLogText, formatSpellRange } from './spell-combat-adapter'
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

export function formatCharacterSubtitle(character: CharacterDetailDto): string {
  const raceName = character.race?.name ?? 'Unknown race'
  const classes = character.classes.length > 0
    ? character.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'

  return `${raceName} • ${classes}`
}

export function formatAllyOptionSubtitle(option: {
  race: { name: string } | null
  classes: { className: string; level: number }[]
  ownerName?: string
}): string {
  const classLabel = option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className} ${cls.level}`).join(' / ')
    : 'No class levels'
  const ownerLabel = option.ownerName ? ` • ${option.ownerName}` : ''
  return `${option.race?.name ?? 'Unknown race'} • ${classLabel}${ownerLabel}`
}

export function formatNpcOptionSubtitle(option: {
  race?: string | null
  classes?: { className?: string; level: number }[]
}): string {
  const classLabel = option.classes && option.classes.length > 0
    ? option.classes.map((cls) => `${cls.className ?? 'Class'} ${cls.level}`).join(' / ')
    : 'No class levels'
  return `${option.race ?? 'Unknown race'} • ${classLabel}`
}

export function formatMonsterOptionSubtitle(monster: Monster): string {
  const typeLabel = monster.type ?? 'monster'
  const sizeLabel = monster.sizeCategory ?? 'size unknown'
  const challengeRating = monster.lore?.challengeRating ?? '—'
  return `CR ${challengeRating} • ${sizeLabel} ${typeLabel}`
}
