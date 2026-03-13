import type { EditionRuleBecmi } from "../../edition/becmi/monster.types"
import type { EditionRuleBx } from "../../edition/bx/monster.types"
import type { Monster } from "@/features/content/monsters/domain/types"
import type { CoreMechanics } from "../../core/combat.types"

// ---------------------------------------------------------------------------
// Classic D&D (B/X, BECMI) → Core
// ---------------------------------------------------------------------------

export function convertClassicDnDToCore(rule: EditionRuleBecmi | EditionRuleBx, _monster: Monster): CoreMechanics {
  const { mechanics } = rule
  const hitDieModifier = mechanics.hitDieModifier ?? 0

  return {
    hitDice: mechanics.hitDice,
    hitDieSize: 8,                                       // BECMI monsters always use d8
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