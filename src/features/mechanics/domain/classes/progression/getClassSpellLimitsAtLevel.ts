/**
 * Compute spell limits from a class progression at a given class level.
 *
 * Pure domain function — no side effects, no data lookups.
 * Callers provide the ClassProgression; this function interprets it.
 */
import type { ClassProgression } from '@/data/classes.types'

// ---------------------------------------------------------------------------
// Casting mode
// ---------------------------------------------------------------------------

/**
 * How a class acquires and manages spells:
 *
 *  - `known`    — fixed list; cast any known spell using a slot
 *                 (Sorcerer, Bard, Ranger)
 *  - `prepared` — choose daily from class list or spellbook
 *                 (Wizard, Cleric, Druid, Paladin)
 *  - `pact`     — known caster with all slots at a single level;
 *                 Mystic Arcanum for higher levels (Warlock)
 *  - `none`     — class has no spellcasting
 */
export type CastingMode = 'known' | 'prepared' | 'pact' | 'none'

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

export interface SpellLimits {
  castingMode: CastingMode
  cantrips: number
  totalKnown: number
  maxSpellLevel: number
  slotsByLevel: number[]
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

function deriveCastingMode(prog: ClassProgression): CastingMode {
  const sp = prog.spellProgression
  if (!sp) return 'none'
  if (sp.mysticArcanum) return 'pact'
  return sp.type
}

export function getClassSpellLimitsAtLevel(
  prog: ClassProgression,
  classLevel: number,
): SpellLimits {
  const castingMode = deriveCastingMode(prog)
  const sp = prog.spellProgression
  if (!sp) return { castingMode: 'none', cantrips: 0, totalKnown: 0, maxSpellLevel: 0, slotsByLevel: [] }

  const idx = Math.min(classLevel, sp.spellSlots.length) - 1
  const cantrips = sp.cantripsKnown?.[idx] ?? 0
  const totalKnown = sp.spellsKnown?.[idx] ?? 0
  const slots = idx >= 0 ? sp.spellSlots[idx] : []

  let maxSpellLevel = 0
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i] > 0) {
      maxSpellLevel = i + 1
      break
    }
  }

  return { castingMode, cantrips, totalKnown, maxSpellLevel, slotsByLevel: slots }
}
