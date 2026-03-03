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

import { evaluateClassEligibility } from '../rules'
import { classes as classCatalog } from '@/data'
import { getSystemSpells } from '@/features/mechanics/domain/core/rules/systemCatalog.spells'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import { getById } from '@/utils'
import { pruneSelectedSpells } from '../../spells/selection/prune-selected-spells'

// ---------------------------------------------------------------------------
// Label helpers (engine-internal — only used to populate InvalidationItem.label)
// ---------------------------------------------------------------------------

const spellLabel = (id: string) => getSystemSpells(DEFAULT_SYSTEM_RULESET_ID).find((s) => s.id === id)?.name ?? id
const classLabel = (id: string) => getById(classCatalog, id)?.name ?? id

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

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
      wealth: { gp: 0, sp: 0, cp: 0, baseBudget: null },
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
