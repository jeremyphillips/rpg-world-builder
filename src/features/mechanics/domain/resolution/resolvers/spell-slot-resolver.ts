/**
 * Spell slot resolution — computes max and remaining spell slots per level
 * from character class progression and persisted resources.
 *
 * Used by encounter to build CombatActionDefinition.usage for spell actions.
 *
 * KNOWN EDGE CASES:
 * - Multiclass: Uses simplified sum of slots across all spellcasting classes.
 *   PHB p.164 has specific multiclass spell slot rules; this implementation
 *   may diverge for complex multiclass (e.g. warlock + full caster).
 * - Warlock pact magic: Short-rest recharge, all slots same level. Defer to
 *   separate period/resource keys (e.g. pact_slots) when implementing.
 * - Cantrips (level 0): Do not consume slots; omit usage for level-0 spells.
 */

import type { CharacterClass } from '@/features/content/classes/domain/types'
import type { SpellcastingProgression } from '@/shared/types/ruleset'
import { getClassSpellLimitsAtLevel } from '../../progression/class'

/** Resource key for remaining slots at a spell level. e.g. spell_slot_1 = level 1 remaining. */
export const SPELL_SLOT_RESOURCE_PREFIX = 'spell_slot_'

export function getSpellSlotResourceKey(spellLevel: number): string {
  return `${SPELL_SLOT_RESOURCE_PREFIX}${spellLevel}`
}

export type SpellSlotAvailability = {
  max: number
  remaining: number
  period: 'day'
}

type ClassEntry = { classId?: string; level: number }

/**
 * Compute max spell slots for a spell level by summing across all
 * spellcasting classes. Uses same logic as spell-selection.
 */
function resolveSpellSlotMax(
  classes: ClassEntry[],
  classesById: Record<string, CharacterClass>,
  spellcastingConfig: SpellcastingProgression,
  spellLevel: number,
): number {
  if (spellLevel <= 0) return 0

  let total = 0
  for (const cls of classes) {
    if (!cls.classId) continue
    const classDef = classesById[cls.classId]
    const prog = classDef?.progression
    if (!prog?.spellProgression) continue

    const lim = getClassSpellLimitsAtLevel(prog, cls.level, spellcastingConfig)
    const idx = spellLevel - 1
    if (idx < lim.slotsByLevel.length && lim.slotsByLevel[idx] > 0) {
      total += lim.slotsByLevel[idx]
    }
  }
  return total
}

/**
 * Resolve spell slot availability for a given spell level.
 *
 * @param classes - Character's class entries (classId, level)
 * @param classesById - Catalog class definitions
 * @param spellcastingConfig - Ruleset spellcasting (slot tables)
 * @param spellLevel - Spell level (1-9; 0 = cantrip, no slots)
 * @param resources - Persisted resources e.g. { spell_slot_1: 2 }. When absent,
 *   remaining defaults to max (treat as full until first spend).
 */
export function resolveSpellSlotAvailability(
  classes: ClassEntry[],
  classesById: Record<string, CharacterClass>,
  spellcastingConfig: SpellcastingProgression,
  spellLevel: number,
  resources?: Record<string, number>,
): SpellSlotAvailability | null {
  if (spellLevel <= 0) return null

  const max = resolveSpellSlotMax(classes, classesById, spellcastingConfig, spellLevel)
  if (max <= 0) return null

  const key = getSpellSlotResourceKey(spellLevel)
  const stored = resources?.[key]
  const remaining = typeof stored === 'number' ? Math.max(0, Math.min(stored, max)) : max

  return { max, remaining, period: 'day' }
}
