import {
  computeCombatStatsFromCharacter,
  type AttackEntry,
} from '@/features/character/hooks/useCombatStats'
import type { CharacterDetailDto } from '@/features/character/read-model'
import { toCharacterForEngine } from '@/features/character/read-model'
import type { Monster } from '@/features/content/monsters/domain/types'
import { buildSkillAffordanceCombatActions } from '@/features/encounter/helpers/actions'
import {
  buildCharacterCombatantInstance,
  buildMonsterCombatantInstance,
} from '@/features/encounter/helpers/combatants'
import {
  buildMonsterAttackEntries,
  buildMonsterExecutableActions,
  buildTurnHooksFromEffects,
} from '@/features/encounter/helpers/monsters'
import { buildSpellCombatActions, getCharacterSpellcastingStats } from '@/features/encounter/helpers/spells'
import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import type { CampaignCatalogAdmin } from '@/features/mechanics/domain/rulesets/campaign/buildCatalog'
import type { RulesetLike } from '@/features/mechanics/domain/rulesets/types/ruleset.types'
import type { CombatantInstance, CombatantSide } from '@/features/mechanics/domain/combat'
import type { Spell } from '@/features/content/spells/domain/types/spell.types'
import {
  buildActiveMonsterEffects,
  buildMonsterTurnHooks,
  DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER,
} from '@/features/mechanics/domain/combat/runtime/monster-runtime'

export function buildCharacterCombatantForGameSession(args: {
  character: CharacterDetailDto
  catalog: CampaignCatalogAdmin
  ruleset: RulesetLike
  runtimeId: string
  side: CombatantSide
  sourceKind: 'pc' | 'npc'
}): CombatantInstance {
  const { character, catalog, ruleset, runtimeId, side, sourceKind } = args
  const engineCharacter = toCharacterForEngine(character)
  const combatStats = computeCombatStatsFromCharacter(engineCharacter, catalog, ruleset)

  const attacks = combatStats.attacks.map((attack: AttackEntry) => ({
    id: `${character.id}-${attack.weaponId}-${attack.hand}`,
    name: attack.name,
    attackBonus: attack.attackBonus,
    attackBreakdown: attack.attackBreakdown,
    damage: attack.damage,
    damageType: attack.damageType,
    damageBreakdown: attack.damageBreakdown,
    range: attack.range,
  }))

  const turnHooks = buildTurnHooksFromEffects(combatStats.activeEffects)
  const spellStats = getCharacterSpellcastingStats(character, ruleset)
  const spellActions = buildSpellCombatActions({
    runtimeId,
    spellIds: character.spells,
    spellsById: catalog.spellsById as Record<string, Spell>,
    spellSaveDc: spellStats.spellSaveDc,
    spellAttackBonus: spellStats.spellAttackBonus,
    spellcastingAbilityModifier: spellStats.spellcastingAbilityModifier,
    casterLevel: character.level ?? 1,
    resources: character.resources,
  })
  const skillAffordanceActions = buildSkillAffordanceCombatActions({
    proficientSkillIds: character.proficiencies.map((p) => p.id),
    skillProficienciesById: catalog.skillProficienciesById,
  })

  return buildCharacterCombatantInstance({
    runtimeId,
    side,
    sourceKind,
    character,
    combatStats,
    attacks,
    extraActions: [...spellActions, ...skillAffordanceActions],
    turnHooks,
  })
}

export function buildMonsterCombatantForGameSession(args: {
  monster: Monster
  catalog: CampaignCatalogAdmin
  runtimeId: string
}): CombatantInstance {
  const { monster, catalog, runtimeId } = args

  const initiativeModifier = getAbilityModifier(getAbilityScoreValue(monster.mechanics.abilities, 'dex'))
  const armorClass = calculateMonsterArmorClass(monster, catalog.armorById).value
  const averageHitPoints =
    Math.floor(monster.mechanics.hitPoints.count * ((monster.mechanics.hitPoints.die + 1) / 2)) +
    (monster.mechanics.hitPoints.modifier ?? 0)

  const activeEffects = buildActiveMonsterEffects(monster, DEFAULT_MONSTER_RUNTIME_CONTEXT_FOR_ENCOUNTER)
  const attacks = buildMonsterAttackEntries(monster, catalog.weaponsById, activeEffects)
  const executableActions = buildMonsterExecutableActions(monster, catalog.weaponsById, activeEffects)
  const turnHooks = buildMonsterTurnHooks(monster)

  return buildMonsterCombatantInstance({
    runtimeId,
    monster,
    attacks,
    actions: executableActions,
    initiativeModifier,
    armorClass,
    currentHitPoints: averageHitPoints,
    activeEffects,
    turnHooks,
    side: 'enemies',
  })
}
