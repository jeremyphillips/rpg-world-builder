import type { EditionRule1e, EditionRuleHolmes } from "@/features/mechanics/domain/edition"
import type { Monster } from "@/data/monsters/monsters.types"
import type { CoreMechanics } from "@/features/mechanics/domain/core/combat.types"

// ---------------------------------------------------------------------------
// 1e / Holmes → Core
// ---------------------------------------------------------------------------

export function convert1eToCore(rule: EditionRule1e | EditionRuleHolmes, _monster: Monster): CoreMechanics {
    const { mechanics } = rule
    const hitDieModifier = mechanics.hitDieModifier ?? 0
  
    return {
      hitDice: mechanics.hitDice,
      hitDieSize: 8,                                       // 1e monsters always use d8
      armorClass: 19 - mechanics.armorClass,               // descending AC → ascending
      hpAverage: Math.round((mechanics.hitDice * 4.5) + hitDieModifier),
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