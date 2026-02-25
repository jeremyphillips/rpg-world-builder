// ---------------------------------------------------------------------------
// Spell Types — Cross-Edition Schema
// ---------------------------------------------------------------------------
//
// Simplified schema: enough to drive spell selection in the character builder,
// cross-edition comparison, and spell list display. Full SRD-style reference
// fields are sketched out below in a commented-out block for future expansion.
//

import type { EditionId } from '@/data'

// ---------------------------------------------------------------------------
// Active types (simplified)
// ---------------------------------------------------------------------------

export interface Spell {
  id: string
  name: string
  school: string                          // 'evocation', 'abjuration', 'conjuration', etc.
  editions: SpellEditionEntry[]
}

export interface SpellEditionEntry {
  edition: EditionId | string
  level: number                           // 0 = cantrip (5e), 1-9 for leveled spells
  classes: string[]                       // canonical class IDs: ['wizard', 'sorcerer']
  ritual?: boolean                        // can be cast as a ritual
  concentration?: boolean                 // requires concentration (5e)
  source?: string                         // 'PHB', 'XGE', 'TCOE', etc.
}

// ---------------------------------------------------------------------------
// Full-featured types (commented out — roadmap for future expansion)
// ---------------------------------------------------------------------------
//
// When ready, promote these to active types and extend SpellEditionEntry.
//
// interface SpellEditionEntryFull extends SpellEditionEntry {
//   // Casting
//   castingTime: string                    // '1 action', '1 bonus action', '1 segment'
//   components: SpellComponents
//
//   // Targeting
//   range: string                          // '120 feet', 'Touch', 'Self'
//   area?: string                          // '20-foot radius sphere'
//   target?: string                        // 'a creature you can see within range'
//
//   // Effect
//   duration: string                       // 'Instantaneous', '1 minute', '1 round/level'
//   savingThrow?: string                   // 'Dexterity half', 'none'
//   attackRoll?: boolean                   // does it require an attack roll?
//   damageType?: string                    // 'force', 'fire', 'radiant'
//
//   // Description
//   description: string                    // full spell text
//   higherLevels?: string                  // 5e upcasting text
//
//   // Source
//   page?: number
//
//   // ── 3e/3.5e-specific ────────────────────────────────────────
//   subschool?: string                     // 'creation', 'healing', 'figment'
//   descriptors?: string[]                 // ['force'], ['fire', 'evil']
//   spellResistance?: boolean              // does SR apply?
//
//   // ── 2e-specific ─────────────────────────────────────────────
//   sphere?: string                        // priest spheres: 'combat', 'healing', 'all'
//
//   // ── 5e-specific ─────────────────────────────────────────────
//   domains?: string[]                     // cleric domains that grant this spell
//   patrons?: string[]                     // warlock patrons that grant this spell
// }
//
// interface SpellComponents {
//   verbal: boolean
//   somatic: boolean
//   material?: string | boolean            // true = has material, string = specific material
//   materialConsumed?: boolean             // is the material consumed?
//   materialCost?: number                  // GP cost of material, if any
//   focus?: string                         // 3e: 'a glass rod'
//   divineFocus?: boolean                  // 3e: DF component
//   xpCost?: number                        // 3e: XP cost
// }
//
// ── Example: Magic Missile (full-featured, 5e) ──────────────────
//
// {
//   id: 'magicMissile',
//   name: 'Magic Missile',
//   school: 'evocation',
//   editions: [
//     {
//       edition: '5e',
//       level: 1,
//       classes: ['wizard', 'sorcerer'],
//       source: 'PHB',
//       page: 257,
//       castingTime: '1 action',
//       components: { verbal: true, somatic: true },
//       range: '120 feet',
//       target: 'a creature you can see within range',
//       duration: 'Instantaneous',
//       savingThrow: 'none',
//       attackRoll: false,
//       damageType: 'force',
//       description:
//         'You create three glowing darts of magical force. Each dart hits '
//         + 'a creature of your choice that you can see within range. A dart '
//         + 'deals 1d4 + 1 force damage to its target. The darts all strike '
//         + 'simultaneously, and you can direct them to hit one creature or several.',
//       higherLevels:
//         'When you cast this spell using a spell slot of 2nd level or higher, '
//         + 'the spell creates one more dart for each slot level above 1st.',
//     }
//   ]
// }
