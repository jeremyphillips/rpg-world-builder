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
import type { Spell } from '@/features/content/spells/domain/types'
import type { CharacterClass } from '@/features/content/classes/domain/types'
import { getClassSpellLimitsAtLevel, type CastingMode } from '@/features/mechanics/domain/progression/class'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpellSelectionLimits = {
  castingModes: CastingMode[]
  perLevelMax: Map<number, number>
  maxSpellLevel: number
  totalKnown: number
}

export type SpellSelectionModel = {
  availableByLevel: Map<number, Spell[]>
  limits: SpellSelectionLimits
  selectedPerLevel: Map<number, number>
  totalSelectedLeveled: number
}

export type SpellSelectionDraft = {
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

/**
 * Build the spell selection model from catalog data (no edition lookup).
 *
 * @param draft       Current builder state (selected classes + spells)
 * @param classesById Catalog class definitions (used for progression data)
 * @param allSpells   Catalog spells (flat core spells, filtered by campaign policy)
 */
export function buildSpellSelectionModel(
  draft: SpellSelectionDraft,
  classesById: Record<string, CharacterClass>,
  allSpells: Record<string, Spell>,
): SpellSelectionModel {
  const { classes, spells: selectedSpells = [] } = draft

  const emptyLimits: SpellSelectionLimits = {
    castingModes: [],
    perLevelMax: new Map(),
    maxSpellLevel: 0,
    totalKnown: 0,
  }

  const classIds = classes
    .map(c => c.classId)
    .filter((id): id is string => !!id)

  if (classIds.length === 0) {
    return {
      availableByLevel: new Map(),
      limits: emptyLimits,
      selectedPerLevel: new Map(),
      totalSelectedLeveled: 0,
    }
  }

  // Gather available spells: any spell whose `classes` array overlaps with
  // the character's selected class IDs
  const classIdSet = new Set(classIds)
  const available: Spell[] = Object.values(allSpells).filter(spell =>
    spell.classes.some(c => classIdSet.has(c))
  )

  // Group by spell level
  const availableByLevel = new Map<number, Spell[]>()
  for (const spell of available) {
    if (!availableByLevel.has(spell.level)) availableByLevel.set(spell.level, [])
    availableByLevel.get(spell.level)!.push(spell)
  }

  // Accumulate limits from each class's spell progression
  const perLevelMax = new Map<number, number>()
  let maxSpellLevel = 0
  let totalKnown = 0
  const castingModeSet = new Set<CastingMode>()

  for (const cls of classes) {
    if (!cls.classId) continue
    const classDef = classesById[cls.classId]
    const prog = classDef?.progression
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
  }

  // Count current selections per level
  const selectedSet = new Set(selectedSpells)
  const selectedPerLevel = new Map<number, number>()
  let totalSelectedLeveled = 0

  for (const [level, spells] of availableByLevel) {
    let count = 0
    for (const s of spells) {
      if (selectedSet.has(s.id)) count++
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

  const levelMax = model.limits.perLevelMax.get(spellLevel) ?? 0
  const levelCount = model.selectedPerLevel.get(spellLevel) ?? 0
  if (levelMax > 0 && levelCount >= levelMax) {
    return { spells: currentSpells, changed: false, blockedReason: 'level_full' }
  }

  if (
    spellLevel > 0 &&
    model.limits.totalKnown > 0 &&
    model.totalSelectedLeveled >= model.limits.totalKnown
  ) {
    return { spells: currentSpells, changed: false, blockedReason: 'total_known_full' }
  }

  return { spells: [...currentSpells, spellId], changed: true }
}
