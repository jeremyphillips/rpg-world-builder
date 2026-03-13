import type { EditionRuleOdd } from "../../edition/odd/monster.types"
import type { Monster } from "@/features/content/monsters/domain/types"
import type { CoreMechanics } from "../../core/combat.types"

export function convertOddToCore(rule: EditionRuleOdd, _monster: Monster): CoreMechanics {
  const { mechanics } = rule
  const hitDieModifier = mechanics.hitDieModifier ?? 0
  const avgPerDie = (mechanics.hitDieSize + 1) / 2       // 3.5 for d6, 4.5 for d8

  return {
    hitDice: mechanics.hitDice,
    hitDieSize: mechanics.hitDieSize,
    armorClass: 19 - mechanics.armorClass,               // descending AC → ascending
    hpAverage: Math.round((mechanics.hitDice * avgPerDie) + hitDieModifier),
    attackBonus: 20 - mechanics.thac0,                   // THAC0 → attack bonus
    attacks: mechanics.attacks,
    movement: {
      ground: mechanics.movement.ground
        ? Math.round(mechanics.movement.ground / 3 / 5) * 5
        : undefined,
      fly: mechanics.movement.fly
        ? Math.round(mechanics.movement.fly / 3 / 5) * 5
        : undefined,
      swim: mechanics.movement.swim
        ? Math.round(mechanics.movement.swim / 3 / 5) * 5
        : undefined,
    },
    specialDefenses: mechanics.specialDefenses,
  }
}