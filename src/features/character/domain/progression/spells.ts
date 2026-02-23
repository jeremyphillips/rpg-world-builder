/**
 * @deprecated Use buildSpellSelectionModel from
 * '@/features/mechanics/domain/spells/selection' instead.
 *
 * These functions are kept for backward compatibility.
 */
import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import { getClassProgression } from '@/features/mechanics/domain/progression'
import { getClassSpellLimitsAtLevel } from '@/features/mechanics/domain/spells/progression'
import { getAvailableSpells } from '@/features/mechanics/domain/spells/catalog'

/** @deprecated Use buildSpellSelectionModel instead. */
export function computeSpellLimits(state: CharacterBuilderState) {
  const perLevelMax = new Map<number, number>()
  let maxSpellLevel = 0
  let totalKnown = 0

  if (!state.edition) return { perLevelMax, maxSpellLevel, totalKnown }

  for (const cls of state.classes) {
    if (!cls.classId) continue
    const prog = getClassProgression(cls.classId, state.edition)
    if (!prog?.spellProgression) continue

    const limits = getClassSpellLimitsAtLevel(prog, cls.level)
    if (limits.cantrips > 0) {
      perLevelMax.set(0, (perLevelMax.get(0) ?? 0) + limits.cantrips)
    }
    for (let i = 0; i < limits.slotsByLevel.length; i++) {
      const spellLevel = i + 1
      if (limits.slotsByLevel[i] > 0) {
        perLevelMax.set(spellLevel, (perLevelMax.get(spellLevel) ?? 0) + limits.slotsByLevel[i])
      }
    }
    maxSpellLevel = Math.max(maxSpellLevel, limits.maxSpellLevel)
    totalKnown += limits.totalKnown
  }

  return { perLevelMax, maxSpellLevel, totalKnown }
}

/** @deprecated Use buildSpellSelectionModel instead. */
export function getAvailableSpellsByEditionAndClass(character: CharacterBuilderState) {
  const availableIds = new Set<string>()
  const spellLevelMap = new Map<string, number>()

  if (!character.edition) return { availableIds, spellLevelMap }

  for (const cls of character.classes) {
    if (!cls.classId) continue
    for (const s of getAvailableSpells(cls.classId, character.edition)) {
      availableIds.add(s.spell.id)
      spellLevelMap.set(s.spell.id, s.entry.level)
    }
  }

  return { availableIds, spellLevelMap }
}
