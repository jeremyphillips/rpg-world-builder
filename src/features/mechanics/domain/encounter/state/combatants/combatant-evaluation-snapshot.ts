import type { AbilityScoreMapResolved } from '@/features/mechanics/domain/character/abilities/abilities.types'
import type { CreatureSnapshot } from '@/features/mechanics/domain/conditions/evaluation-context.types'
import type { CombatantInstance } from '../types'

const DEFAULT_ABILITIES: AbilityScoreMapResolved = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
}

/** Minimal snapshot for {@link evaluateCondition} (creature type, conditions, etc.). */
export function combatantToCreatureSnapshot(c: CombatantInstance): CreatureSnapshot {
  const scores = c.stats.abilityScores
  return {
    id: c.instanceId,
    level: 1,
    hp: c.stats.currentHitPoints,
    hpMax: c.stats.maxHitPoints,
    abilities: scores
      ? ({ ...DEFAULT_ABILITIES, ...scores } as AbilityScoreMapResolved)
      : DEFAULT_ABILITIES,
    conditions: c.conditions.map((m) => m.label),
    resources: {},
    equipment: {
      armorEquipped: c.equipment?.armorEquipped ?? null,
      shieldEquipped: c.equipment?.shieldId != null && c.equipment.shieldId.length > 0,
    },
    flags: {},
    ...(c.creatureType !== undefined ? { creatureType: c.creatureType } : {}),
  }
}
