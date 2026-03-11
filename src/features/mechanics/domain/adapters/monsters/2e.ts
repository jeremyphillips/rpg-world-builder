import type { EditionRule2e } from "../../edition/2e/monster.types"
import type { Monster } from "@/features/content/monsters/domain/types/monster.types"
import type { CoreMechanics } from '../../core/combat.types'

// ---------------------------------------------------------------------------
// 2e → Core
// ---------------------------------------------------------------------------


export function convert2eToCore(rule: EditionRule2e, _monster: Monster): CoreMechanics {
  const { mechanics } = rule

  return {
    hitDice: mechanics.hitDice,
    hitDieSize: 8,
    armorClass: 19 - mechanics.armorClass,  // descending AC → ascending
    hpAverage: Math.round(mechanics.hitDice * 4.5),
    attackBonus: 20 - mechanics.thac0,       // THAC0 → attack bonus
    attacks: mechanics.attacks,
    movement: {
      ground: mechanics.movement.ground
        ? Math.round(mechanics.movement.ground / 3 / 5) * 5  // 2e segments → 5e feet
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