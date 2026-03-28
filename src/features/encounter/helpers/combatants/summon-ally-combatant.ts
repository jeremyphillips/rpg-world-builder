import type { Armor } from '@/features/content/equipment/armor/domain/types/armor.types'
import type { Weapon } from '@/features/content/equipment/weapons/domain/types/weapon.types'
import type { Monster } from '@/features/content/monsters/domain/types'
import { calculateMonsterArmorClass } from '@/features/content/monsters/domain/mechanics/calculateMonsterArmorClass'
import { getAbilityScoreValue } from '@/features/mechanics/domain/character/abilities/abilityScoreMap'
import { getAbilityModifier } from '@/features/mechanics/domain/abilities/getAbilityModifier'
import {
  buildActiveMonsterEffects,
  buildMonsterTurnHooks,
  DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
  type CombatantInstance,
} from '@/features/mechanics/domain/encounter'
import {
  buildMonsterAttackEntries,
  buildMonsterExecutableActions,
} from './monster-combat-adapter'
import { buildMonsterCombatantInstance } from './combatant-builders'

const DEFAULT_SUMMON_CONTEXT = {
  environment: 'none' as const,
  form: 'true-form' as const,
  manual: DEFAULT_MANUAL_MONSTER_TRIGGER_CONTEXT,
}

/**
 * Builds a party-side monster combatant for spells that summon allies (same wiring as opponent setup, different side).
 */
export function buildSummonAllyMonsterCombatant(args: {
  runtimeId: string
  monster: Monster
  weaponsById: Record<string, Weapon>
  armorById: Record<string, Armor>
}): CombatantInstance {
  const { runtimeId, monster, weaponsById, armorById } = args

  const initiativeModifier = getAbilityModifier(getAbilityScoreValue(monster.mechanics.abilities, 'dex'))
  const armorClass = calculateMonsterArmorClass(monster, armorById).value
  const averageHitPoints =
    Math.floor(monster.mechanics.hitPoints.count * ((monster.mechanics.hitPoints.die + 1) / 2)) +
    (monster.mechanics.hitPoints.modifier ?? 0)

  const activeEffects = buildActiveMonsterEffects(monster, DEFAULT_SUMMON_CONTEXT)
  const attacks = buildMonsterAttackEntries(monster, weaponsById, activeEffects)
  const executableActions = buildMonsterExecutableActions(monster, weaponsById, activeEffects)
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
    side: 'party',
  })
}
