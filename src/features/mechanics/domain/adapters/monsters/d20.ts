import type { EditionRule3e } from "../../edition/3e/monster.types"
import type { EditionRule35e } from "../../edition/35e/monster.types"
import type { Monster } from "@/features/content/monsters/domain/types/monster.types"
import type { CoreMechanics } from "../../core/combat.types"

// ---------------------------------------------------------------------------
// d20 System (3e, 3.5e) → Core
// ---------------------------------------------------------------------------

export function convertD20ToCore(rule: EditionRule3e | EditionRule35e, _monster: Monster): CoreMechanics {
  const { mechanics } = rule
  const avgPerDie = (mechanics.hitDieSize + 1) / 2

  return {
    hitDice: mechanics.hitDice,
    hitDieSize: mechanics.hitDieSize,
    armorClass: mechanics.armorClass,              // already ascending
    hpAverage: Math.round(mechanics.hitDice * avgPerDie),
    attackBonus: mechanics.baseAttackBonus,         // BAB → attack bonus
    attacks: mechanics.attacks,
    movement: mechanics.movement,                  // already in feet
    specialDefenses: mechanics.specialDefenses,
  }
}