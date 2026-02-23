/**
 * Spell selection engine — single source of truth for:
 *  - available spells per level
 *  - selection limits (per-level, overall)
 *  - current selection counts
 *  - "is level full?" predicate
 *  - "toggle spell" domain command
 *
 * Both SpellStep and the invalidation pruner call into this module.
 */
import { getClassProgression } from '../../progression'
import { getAvailableSpells, type SpellWithEntry } from '../catalog'
import { groupSpellsByLevel } from '../utils/groupSpellsByLevel'
import { getClassSpellLimitsAtLevel, type CastingMode } from '../progression'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpellSelectionLimits = {
  /** Casting modes present across selected classes (e.g. ['known', 'prepared']). */
  castingModes: CastingMode[]
  perLevelMax: Map<number, number>
  maxSpellLevel: number
  totalKnown: number
}

export type SpellSelectionModel = {
  availableByLevel: Map<number, SpellWithEntry[]>
  limits: SpellSelectionLimits
  selectedPerLevel: Map<number, number>
  totalSelectedLeveled: number
}

export type SpellSelectionDraft = {
  edition?: string
  classes: Array<{ classId?: string; level: number }>
  spells?: string[]
}

export type ToggleResult = {
  spells: string[]
  changed: boolean
  blockedReason?: 'level_full' | 'total_known_full'
}

// ---------------------------------------------------------------------------
// Model builder
// ---------------------------------------------------------------------------

export function buildSpellSelectionModel(draft: SpellSelectionDraft): SpellSelectionModel {
  const { edition, classes, spells: selectedSpells = [] } = draft

  const emptyLimits: SpellSelectionLimits = {
    castingModes: [],
    perLevelMax: new Map(),
    maxSpellLevel: 0,
    totalKnown: 0,
  }

  if (!edition) {
    return {
      availableByLevel: new Map(),
      limits: emptyLimits,
      selectedPerLevel: new Map(),
      totalSelectedLeveled: 0,
    }
  }

  // 1. Gather available spells (deduplicated across classes)
  const allAvailable: SpellWithEntry[] = []
  const seenIds = new Set<string>()

  // 2. Accumulate limits from each class's spell progression
  const perLevelMax = new Map<number, number>()
  let maxSpellLevel = 0
  let totalKnown = 0
  const castingModeSet = new Set<CastingMode>()

  for (const cls of classes) {
    if (!cls.classId) continue
    const prog = getClassProgression(cls.classId, edition)
    if (!prog?.spellProgression) continue

    const lim = getClassSpellLimitsAtLevel(prog, cls.level)
    castingModeSet.add(lim.castingMode)

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

    for (const s of getAvailableSpells(cls.classId, edition)) {
      if (!seenIds.has(s.spell.id)) {
        seenIds.add(s.spell.id)
        allAvailable.push(s)
      }
    }
  }

  const availableByLevel = groupSpellsByLevel(allAvailable)

  // 3. Count current selections per level
  const selectedSet = new Set(selectedSpells)
  const selectedPerLevel = new Map<number, number>()
  let totalSelectedLeveled = 0

  for (const [level, spells] of availableByLevel) {
    let count = 0
    for (const s of spells) {
      if (selectedSet.has(s.spell.id)) count++
    }
    if (count > 0) selectedPerLevel.set(level, count)
    if (level !== 0) totalSelectedLeveled += count
  }

  return {
    availableByLevel,
    limits: { castingModes: [...castingModeSet], perLevelMax, maxSpellLevel, totalKnown },
    selectedPerLevel,
    totalSelectedLeveled,
  }
}

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export function isSpellLevelFull(model: SpellSelectionModel, level: number): boolean {
  const max = model.limits.perLevelMax.get(level) ?? 0
  const count = model.selectedPerLevel.get(level) ?? 0
  if (max > 0 && count >= max) return true
  if (level > 0 && model.limits.totalKnown > 0 && model.totalSelectedLeveled >= model.limits.totalKnown) return true
  return false
}

// ---------------------------------------------------------------------------
// Toggle command
// ---------------------------------------------------------------------------

/**
 * Toggle a spell in/out of the selection, enforcing all limits.
 *
 * Returns the updated spell list and whether the selection actually changed.
 * If adding is blocked, `blockedReason` explains why.
 */
export function toggleSpellSelection(
  currentSpells: string[],
  model: SpellSelectionModel,
  spellId: string,
  spellLevel: number,
): ToggleResult {
  if (currentSpells.includes(spellId)) {
    return { spells: currentSpells.filter(id => id !== spellId), changed: true }
  }

  // Check per-level cap
  const levelMax = model.limits.perLevelMax.get(spellLevel) ?? 0
  const levelCount = model.selectedPerLevel.get(spellLevel) ?? 0
  if (levelMax > 0 && levelCount >= levelMax) {
    return { spells: currentSpells, changed: false, blockedReason: 'level_full' }
  }

  // Check overall known cap (leveled spells only)
  if (
    spellLevel > 0 &&
    model.limits.totalKnown > 0 &&
    model.totalSelectedLeveled >= model.limits.totalKnown
  ) {
    return { spells: currentSpells, changed: false, blockedReason: 'total_known_full' }
  }

  return { spells: [...currentSpells, spellId], changed: true }
}
