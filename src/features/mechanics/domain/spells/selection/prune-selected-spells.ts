/**
 * Spell pruning — single source of truth for deciding which selected
 * spell IDs survive a constraint change.
 *
 * Delegates to buildSpellSelectionModel for limits and availability,
 * then walks the selection list applying the same rules the toggle
 * command would enforce.
 */
import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import { getAvailableSpells } from '../catalog'
import { getClassProgression } from '../../progression'
import { getClassSpellLimitsAtLevel } from '../progression'

export type SpellPruneResult = {
  kept: string[]
  removed: string[]
}

/**
 * Given the selected spell IDs and the *new* builder state, return
 * which spells should be kept and which should be pruned.
 *
 * Pruning rules (in evaluation order per spell):
 *  1. Spell no longer in the available catalog for this edition/class combo
 *  2. Spell level exceeds maximum castable level
 *  3. Cantrips no longer granted (per-level max for level 0 is 0)
 *  4. Per-level slot cap exceeded
 *  5. Overall "known" cap exceeded (known casters)
 */
export function pruneSelectedSpells(state: CharacterBuilderState): SpellPruneResult {
  const selected = state.spells ?? []
  if (selected.length === 0) return { kept: [], removed: [] }

  const { edition, classes } = state
  if (!edition) return { kept: [], removed: [...selected] }

  // Build availability + level map
  const availableIds = new Set<string>()
  const spellLevelMap = new Map<string, number>()
  const perLevelMax = new Map<number, number>()
  let maxSpellLevel = 0
  let totalKnown = 0

  for (const cls of classes) {
    if (!cls.classId) continue

    for (const s of getAvailableSpells(cls.classId, edition)) {
      availableIds.add(s.spell.id)
      spellLevelMap.set(s.spell.id, s.entry.level)
    }

    const prog = getClassProgression(cls.classId, edition)
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
