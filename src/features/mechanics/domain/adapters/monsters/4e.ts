import type { EditionRule4e } from "../../edition/4e/monster.types"
import type { Monster } from "@/features/content/monsters/domain/types"
import type { CoreMechanics } from "../../core/combat.types"

// ---------------------------------------------------------------------------
// 4e → Core (flat HP, no hit dice — reverse-engineer HD from HP)
// ---------------------------------------------------------------------------

export function convert4eToCore(rule: EditionRule4e, _monster: Monster): CoreMechanics {
  const { mechanics } = rule
  const estimatedHD = Math.max(1, Math.round(mechanics.hitPoints / 4.5))

  return {
    hitDice: estimatedHD,
    hitDieSize: 8,
    armorClass: mechanics.armorClass,               // already ascending
    hpAverage: mechanics.hitPoints,                  // flat HP, direct pass-through
    attackBonus: Math.floor(mechanics.level / 2) + 3, // level-based estimate
    attacks: mechanics.attacks,
    movement: mechanics.movement,                    // already in feet
    specialDefenses: mechanics.specialDefenses,
  }
}