import type { Effect, ProficiencyGrantEffect } from '../effects/effects.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProficiencyTarget = 'armor' | 'weapon' | 'tool' | 'skill' | 'saving-throw'

export type EquipmentProficiency = {
  categories: string[]
  items: string[]
}

export type EquipmentEligibility = {
  allowed: boolean
  reasons: string[]
}

// ---------------------------------------------------------------------------
// Derive proficiency from engine effects
// ---------------------------------------------------------------------------

function isProficiencyGrant(e: Effect): e is ProficiencyGrantEffect {
  return e.kind === 'grant' && e.grantType === 'proficiency'
}

/**
 * Extract equipment proficiency (categories + items) for a given target
 * from the engine's collected effects.
 *
 * Reads all GrantEffects with grantType 'proficiency', filters to the
 * requested target ('armor' | 'weapon' | etc.), and unions their
 * categories and items into a single EquipmentProficiency.
 */
export function deriveEquipmentProficiency(
  effects: Effect[],
  target: ProficiencyTarget
): EquipmentProficiency {
  const categories = new Set<string>()
  const items = new Set<string>()

  for (const e of effects) {
    if (!isProficiencyGrant(e)) continue

    for (const g of e.value) {
      if (g.target !== target) continue
      for (const c of g.categories ?? []) categories.add(c)
      for (const id of g.items ?? []) items.add(id)
    }
  }

  return { categories: [...categories], items: [...items] }
}

// ---------------------------------------------------------------------------
// Item-level proficiency check
// ---------------------------------------------------------------------------

/**
 * Check whether a single equipment item is covered by a proficiency.
 *
 *  1. 'all' or 'allArmor' in granted categories → always allowed
 *  2. Item's category matches a granted category
 *  3. Item's id appears in the explicit items list
 */
export function isItemProficient(
  item: { id: string; category?: string },
  proficiency: EquipmentProficiency
): boolean {
  const { categories, items } = proficiency
  if (categories.includes('all') || categories.includes('allArmor')) return true
  if (item.category && categories.includes(item.category)) return true
  if (items.includes(item.id)) return true

  return false
}

// ---------------------------------------------------------------------------
// Eligibility (proficiency + reasons)
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a character is eligible to use an equipment item,
 * returning a structured result with human-readable reasons.
 *
 * TODO: Extend with loadout conflict checks (two-handed + shield),
 *       attunement limits, edition restrictions, etc.
 */
export function evaluateEquipmentEligibility(
  item: { id: string; category?: string },
  proficiency: EquipmentProficiency
): EquipmentEligibility {
  if (isItemProficient(item, proficiency)) {
    return { allowed: true, reasons: [] }
  }
  return { allowed: false, reasons: ['Not proficient'] }
}
