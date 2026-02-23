import type { Effect, GrantEffect, ProficiencyGrantValue } from '../effects/effects.types'
import { resolveEquipmentEdition } from '@/features/equipment/domain'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProficiencyTarget = 'armor' | 'weapon' | 'tool' | 'skill' | 'saving_throw'

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

function isProficiencyGrant(e: Effect): e is GrantEffect {
  return e.kind === 'grant' && (e as GrantEffect).grantType === 'proficiency'
}

function isGrantValueArray(value: unknown): value is ProficiencyGrantValue[] {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'target' in value[0]
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

    const grants = e.value
    if (!isGrantValueArray(grants)) continue

    for (const g of grants) {
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
 * Resolves the edition to the equipment-edition key, then checks:
 *  1. 'all' / 'allArmor' in categories → always allowed
 *  2. Item's editionData.category appears in categories
 *  3. Item's id appears in the explicit items list
 */
export function isItemProficient(
  item: { id: string; editionData?: { edition: string; category?: string }[] },
  edition: string,
  proficiency: EquipmentProficiency
): boolean {
  if (!Array.isArray(item.editionData)) return false

  const effectiveEdition = resolveEquipmentEdition(edition)
  const editionEntry = item.editionData.find((e) => e.edition === effectiveEdition)
  if (!editionEntry) return false

  const { categories, items } = proficiency
  if (categories.includes('all') || categories.includes('allArmor')) return true
  if (categories.length > 0 && editionEntry.category && categories.includes(editionEntry.category)) return true
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
  item: { id: string; editionData?: { edition: string; category?: string }[] },
  edition: string,
  proficiency: EquipmentProficiency
): EquipmentEligibility {
  if (isItemProficient(item, edition, proficiency)) {
    return { allowed: true, reasons: [] }
  }
  return { allowed: false, reasons: ['Not proficient'] }
}
