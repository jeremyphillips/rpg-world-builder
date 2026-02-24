/**
 * Declarative invalidation rules (engine-owned).
 *
 * All items use `{ id, kind, label }` — the engine resolves display
 * names itself so consumers never need catalog access.
 *
 * Triggers support both key strings (shallow !==) and comparator
 * functions (for arrays / objects that need semantic comparison).
 */
import type { InvalidationRule, InvalidationItem } from './types'
import type { CharacterBuilderState } from '@/features/characterBuilder/types'
import type { EditionId } from '@/data/editions/edition.types'

import { getAllowedRaceIdsFromDraft, getAllowedClassIdsFromDraft } from '../options'
import { evaluateClassEligibility } from '../rules'
import { classes as classCatalog, races as raceCatalog, equipment } from '@/data'
import { spells as spellCatalog } from '@/data/classes/spells'
import { resolveEquipmentEdition } from '@/features/equipment/domain'
import { getById } from '@/domain/lookups'
import { pruneSelectedSpells } from '../../spells/selection/prune-selected-spells'

const { weapons: weaponsData, armor: armorData, gear: gearData } = equipment

// ---------------------------------------------------------------------------
// Label helpers (engine-internal — only used to populate InvalidationItem.label)
// ---------------------------------------------------------------------------

const spellLabel = (id: string) => spellCatalog.find(s => s.id === id)?.name ?? id
const weaponLabel = (id: string) => getById(weaponsData, id)?.name ?? id
const armorLabel = (id: string) => getById(armorData, id)?.name ?? id
const gearLabel = (id: string) => getById(gearData, id)?.name ?? id
const classLabel = (id: string) => getById(classCatalog, id)?.name ?? id
const raceLabel = (id: string) => getById(raceCatalog, id)?.name ?? id

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function itemHasEdition(
  items: readonly { id: string; editionData: { edition: string }[] }[],
  itemId: string,
  edition: string
): boolean {
  const item = items.find(i => i.id === itemId)
  if (!item) return false
  return item.editionData.some(d => d.edition === edition)
}

/**
 * Semantic comparator for the `classes` array.
 * Fires when classId set, level, or slot count changes — not on reference identity.
 */
function classesChanged(
  prev: CharacterBuilderState,
  next: CharacterBuilderState,
): boolean {
  const a = prev.classes
  const b = next.classes
  if (a.length !== b.length) return true
  for (let i = 0; i < a.length; i++) {
    if (a[i].classId !== b[i].classId) return true
    if (a[i].classDefinitionId !== b[i].classDefinitionId) return true
    if (a[i].level !== b[i].level) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Shared detect / resolve for spells (used by multiple rules)
// ---------------------------------------------------------------------------

function detectInvalidSpellItems(
  _prev: CharacterBuilderState,
  next: CharacterBuilderState,
): InvalidationItem[] {
  const { removed } = pruneSelectedSpells(next)
  return removed.map(id => ({ id, kind: 'spell' as const, label: spellLabel(id) }))
}

function resolveInvalidSpells(
  state: CharacterBuilderState,
  items: InvalidationItem[],
): CharacterBuilderState {
  const invalidIds = new Set(items.map(i => i.id))
  const kept = (state.spells ?? []).filter(id => !invalidIds.has(id))
  return { ...state, spells: kept }
}

// ---------------------------------------------------------------------------
// Shared resolve for classes (used by multiple rules)
// ---------------------------------------------------------------------------

function resolveInvalidClasses(
  state: CharacterBuilderState,
  items: InvalidationItem[],
): CharacterBuilderState {
  const invalidIds = new Set(items.map(i => i.id))
  let classes = state.classes.filter(cls => !cls.classId || !invalidIds.has(cls.classId))
  if (classes.length === 0) classes = [{ level: 1 }]
  return { ...state, classes }
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

export const INVALIDATION_RULES: InvalidationRule[] = [

  // ── Edition changes ─────────────────────────────────────────────────────

  // {
  //   id: 'edition→race',
  //   triggers: ['edition'],
  //   affectedStep: 'race',
  //   label: 'Race',
  //   detect: (_prev, next) => {
  //     if (!next.edition || !next.race) return []
  //     const allowed = getAllowedRaceIdsFromDraft(next)
  //     if (allowed.includes(next.race)) return []
  //     return [{ id: next.race, kind: 'race', label: raceLabel(next.race) }]
  //   },
  //   resolve: (state) => ({ ...state, race: undefined }),
  // },

  // {
  //   id: 'edition→class',
  //   triggers: ['edition'],
  //   affectedStep: 'class',
  //   label: 'Classes',
  //   detect: (_prev, next) => {
  //     if (!next.edition) return []
  //     const allowed = new Set(getAllowedClassIdsFromDraft(next))
  //     const invalid: InvalidationItem[] = []
  //     for (const cls of next.classes) {
  //       if (cls.classId && !allowed.has(cls.classId)) {
  //         invalid.push({ id: cls.classId, kind: 'class', label: classLabel(cls.classId) })
  //       }
  //     }
  //     return invalid
  //   },
  //   resolve: resolveInvalidClasses,
  // },

  // {
  //   id: 'edition→alignment',
  //   triggers: ['edition'],
  //   affectedStep: 'alignment',
  //   label: 'Alignment',
  //   detect: (_prev, next) => {
  //     if (!next.edition || !next.alignment) return []
  //     const alignments = getAlignmentsByEdition(next.edition as EditionId)
  //     const validIds = new Set(alignments.map((a: { id: string }) => a.id))
  //     if (validIds.has(next.alignment)) return []
  //     return [{ id: next.alignment, kind: 'alignment', label: next.alignment }]
  //   },
  //   resolve: (state) => ({ ...state, alignment: undefined }),
  // },

  // {
  //   id: 'edition→spells',
  //   triggers: ['edition'],
  //   affectedStep: 'spells',
  //   label: 'Spells',
  //   detect: detectInvalidSpellItems,
  //   resolve: resolveInvalidSpells,
  // },

  // {
  //   id: 'edition→weapons',
  //   triggers: ['edition'],
  //   affectedStep: 'equipment',
  //   label: 'Weapons',
  //   detect: (_prev, next) => {
  //     if (!next.edition) return []
  //     const ids = next.equipment?.weapons ?? []
  //     if (ids.length === 0) return []
  //     const eqEdition = resolveEquipmentEdition(next.edition)
  //     return ids
  //       .filter(id => !itemHasEdition(weaponsData, id, eqEdition))
  //       .map(id => ({ id, kind: 'equipment' as const, label: weaponLabel(id) }))
  //   },
  //   resolve: (state) => {
  //     if (!state.edition) return state
  //     const eqEdition = resolveEquipmentEdition(state.edition)
  //     const weapons = (state.equipment?.weapons ?? []).filter(
  //       id => itemHasEdition(weaponsData, id, eqEdition)
  //     )
  //     return { ...state, equipment: { ...state.equipment, weapons } }
  //   },
  // },

  // {
  //   id: 'edition→armor',
  //   triggers: ['edition'],
  //   affectedStep: 'equipment',
  //   label: 'Armor',
  //   detect: (_prev, next) => {
  //     if (!next.edition) return []
  //     const ids = next.equipment?.armor ?? []
  //     if (ids.length === 0) return []
  //     const eqEdition = resolveEquipmentEdition(next.edition)
  //     return ids
  //       .filter(id => !itemHasEdition(armorData, id, eqEdition))
  //       .map(id => ({ id, kind: 'equipment' as const, label: armorLabel(id) }))
  //   },
  //   resolve: (state) => {
  //     if (!state.edition) return state
  //     const eqEdition = resolveEquipmentEdition(state.edition)
  //     const armor = (state.equipment?.armor ?? []).filter(
  //       id => itemHasEdition(armorData, id, eqEdition)
  //     )
  //     return { ...state, equipment: { ...state.equipment, armor } }
  //   },
  // },

  // {
  //   id: 'edition→gear',
  //   triggers: ['edition'],
  //   affectedStep: 'equipment',
  //   label: 'Gear',
  //   detect: (_prev, next) => {
  //     if (!next.edition) return []
  //     const ids = next.equipment?.gear ?? []
  //     if (ids.length === 0) return []
  //     const eqEdition = resolveEquipmentEdition(next.edition)
  //     return ids
  //       .filter(id => !itemHasEdition(gearData, id, eqEdition))
  //       .map(id => ({ id, kind: 'equipment' as const, label: gearLabel(id) }))
  //   },
  //   resolve: (state) => {
  //     if (!state.edition) return state
  //     const eqEdition = resolveEquipmentEdition(state.edition)
  //     const gear = (state.equipment?.gear ?? []).filter(
  //       id => itemHasEdition(gearData, id, eqEdition)
  //     )
  //     return { ...state, equipment: { ...state.equipment, gear } }
  //   },
  // },

  // ── Setting changes ─────────────────────────────────────────────────────

  // {
  //   id: 'setting→race',
  //   triggers: ['setting'],
  //   affectedStep: 'race',
  //   label: 'Race',
  //   detect: (_prev, next) => {
  //     if (!next.edition || !next.race) return []
  //     const allowed = getAllowedRaceIdsFromDraft(next)
  //     if (allowed.includes(next.race)) return []
  //     return [{ id: next.race, kind: 'race', label: raceLabel(next.race) }]
  //   },
  //   resolve: (state) => ({ ...state, race: undefined }),
  // },

  // {
  //   id: 'setting→class',
  //   triggers: ['setting'],
  //   affectedStep: 'class',
  //   label: 'Classes',
  //   detect: (_prev, next) => {
  //     if (!next.edition) return []
  //     const allowed = new Set(getAllowedClassIdsFromDraft(next))
  //     const invalid: InvalidationItem[] = []
  //     for (const cls of next.classes) {
  //       if (cls.classId && !allowed.has(cls.classId)) {
  //         invalid.push({ id: cls.classId, kind: 'class', label: classLabel(cls.classId) })
  //       }
  //     }
  //     return invalid
  //   },
  //   resolve: resolveInvalidClasses,
  // },

  // ── Level changes ───────────────────────────────────────────────────────

  {
    id: 'level→multiclass',
    triggers: ['totalLevel'],
    affectedStep: 'class',
    label: 'Multiclass allocations',
    detect: (prev, next) => {
      if ((next.totalLevel ?? 0) >= (prev.totalLevel ?? 0)) return []

      const budget = next.totalLevel ?? 0
      const invalid: InvalidationItem[] = []
      let remaining = budget

      for (let i = 0; i < prev.classes.length; i++) {
        const cls = prev.classes[i]
        const min = i === 0 ? 1 : 0
        const clamped = Math.max(min, Math.min(cls.level, remaining))
        remaining -= clamped

        if (i > 0 && clamped === 0 && cls.classId) {
          invalid.push({ id: cls.classId, kind: 'class', label: classLabel(cls.classId) })
        }
      }

      return invalid
    },
    resolve: (state) => {
      let budget = state.totalLevel ?? 0
      const classes = state.classes
        .map((cls, i) => {
          const min = i === 0 ? 1 : 0
          const level = Math.max(min, Math.min(cls.level, budget))
          budget -= level
          return { ...cls, level }
        })
        .filter((cls, i) => i === 0 || cls.level > 0)

      return { ...state, classes }
    },
  },

  {
    id: 'level→spells',
    triggers: ['totalLevel', classesChanged],
    affectedStep: 'spells',
    label: 'Spells',
    detect: detectInvalidSpellItems,
    resolve: resolveInvalidSpells,
  },

  {
    id: 'level→wealth',
    triggers: ['totalLevel'],
    affectedStep: 'equipment',
    label: 'Wealth',
    detect: (prev, next) => {
      if ((prev.totalLevel ?? 0) === (next.totalLevel ?? 0)) return []
      const hasWealth = (next.wealth?.gp ?? 0) > 0
        || (next.wealth?.sp ?? 0) > 0
        || (next.wealth?.cp ?? 0) > 0
      if (!hasWealth) return []
      return [{ id: 'wealth-recalc', kind: 'message', label: 'Starting gold will be recalculated' }]
    },
    resolve: (state) => ({
      ...state,
      wealth: { gp: 0, sp: 0, cp: 0, baseGp: 0 },
    }),
  },

  // ── Class changes ───────────────────────────────────────────────────────

  {
    id: 'class→spells',
    triggers: [classesChanged],
    affectedStep: 'spells',
    label: 'Spells',
    detect: detectInvalidSpellItems,
    resolve: resolveInvalidSpells,
  },

  // ── Race changes ────────────────────────────────────────────────────────

  {
    id: 'race→class',
    triggers: ['race'],
    affectedStep: 'class',
    label: 'Classes',
    detect: (_prev, next) => {
      if (!next.race) return []

      const invalid: InvalidationItem[] = []
      for (const cls of next.classes) {
        if (!cls.classId) continue
        const result = evaluateClassEligibility(cls.classId, next)
        if (!result.allowed && result.reasons.some(r => r.code === 'race_not_allowed')) {
          invalid.push({ id: cls.classId, kind: 'class', label: classLabel(cls.classId) })
        }
      }

      return invalid
    },
    resolve: resolveInvalidClasses,
  },

  // ── Alignment changes ──────────────────────────────────────────────────

  {
    id: 'alignment→class',
    triggers: ['alignment'],
    affectedStep: 'class',
    label: 'Classes',
    detect: (_prev, next) => {
      if (!next.alignment) return []

      const invalid: InvalidationItem[] = []
      for (const cls of next.classes) {
        if (!cls.classId) continue
        const result = evaluateClassEligibility(cls.classId, next)
        if (!result.allowed && result.reasons.some(r => r.code === 'alignment_not_allowed')) {
          invalid.push({ id: cls.classId, kind: 'class', label: classLabel(cls.classId) })
        }
      }

      return invalid
    },
    resolve: resolveInvalidClasses,
  },
]
