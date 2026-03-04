/**
 * Spell pruning — decides which selected spell IDs survive a constraint change.
 *
 * Uses catalog data directly (no edition lookup).
 */
import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import type { Spell } from '@/features/content/domain/types'
import type { CharacterClass } from '@/features/classes/domain/types'
import { getClassSpellLimitsAtLevel } from '@/features/mechanics/domain/classes/progression'
import { systemCatalog } from '../../core/rules/systemCatalog'

export type SpellPruneResult = {
  kept: string[]
  removed: string[]
}

/**
 * Given the selected spell IDs and the *new* builder state, return
 * which spells should be kept and which should be pruned.
 *
 * @param state       Current builder state
 * @param classesById Catalog class definitions
 * @param allSpells   Catalog spells (flat core spells)
 */
export function pruneSelectedSpells(
  state: CharacterBuilderState,
  classesById?: Record<string, CharacterClass>,
  allSpells?: Record<string, Spell>,
): SpellPruneResult {
  const resolvedClasses = classesById ?? systemCatalog.classesById
  const resolvedSpells = allSpells ?? systemCatalog.spellsById
  const selected = state.spells ?? []
  if (selected.length === 0) return { kept: [], removed: [] }

  const { classes } = state

  const classIds = classes
    .map(c => c.classId)
    .filter((id): id is string => !!id)

  if (classIds.length === 0) return { kept: [], removed: [...selected] }

  // Build availability + level map from catalog
  const classIdSet = new Set(classIds)
  const availableIds = new Set<string>()
  const spellLevelMap = new Map<string, number>()

  for (const spell of Object.values(resolvedSpells)) {
    if (spell.classes.some(c => classIdSet.has(c))) {
      availableIds.add(spell.id)
      spellLevelMap.set(spell.id, spell.level)
    }
  }

  // Accumulate limits from class progressions
  const perLevelMax = new Map<number, number>()
  let maxSpellLevel = 0
  let totalKnown = 0

  for (const cls of classes) {
    if (!cls.classId) continue
    const classDef = resolvedClasses[cls.classId]
    const prog = classDef?.progression
    if (!prog?.spellProgression) continue

    const lim = getClassSpellLimitsAtLevel(prog, cls.level)
    if (lim.cantrips > 0) {
      perLevelMax.set(0, (perLevelMax.get(0) ?? 0) + lim.cantrips)
    }
    for (let i = 0; i < lim.slotsByLevel.length; i++) {
      const spellLevel = i + 1
      if (lim.slotsByLevel[i] > 0) {
        perLevelMax.set(spellLevel, (perLevelMax.get(spellLevel) ?? 0) + lim.slotsByLevel[i])
      }
    }
    maxSpellLevel = Math.max(maxSpellLevel, lim.maxSpellLevel)
    totalKnown += lim.totalKnown
  }

  // Walk selections applying limits
  const kept: string[] = []
  const removed: string[] = []
  const keptPerLevel = new Map<number, number>()
  let keptLeveledCount = 0

  for (const id of selected) {
    const level = spellLevelMap.get(id)

    if (level === undefined || !availableIds.has(id)) {
      removed.push(id)
      continue
    }
    if (level > 0 && level > maxSpellLevel) {
      removed.push(id)
      continue
    }
    if (level === 0 && (perLevelMax.get(0) ?? 0) === 0) {
      removed.push(id)
      continue
    }

    const max = perLevelMax.get(level) ?? 0
    const currentCount = keptPerLevel.get(level) ?? 0
    if (max > 0 && currentCount >= max) {
      removed.push(id)
      continue
    }
    if (level > 0 && totalKnown > 0 && keptLeveledCount >= totalKnown) {
      removed.push(id)
      continue
    }

    kept.push(id)
    keptPerLevel.set(level, currentCount + 1)
    if (level > 0) keptLeveledCount++
  }

  return { kept, removed }
}
