/**
 * Legacy equipment proficiency helpers.
 *
 * All functions here are deprecated — prefer using deriveEquipmentProficiency
 * and evaluateEquipmentEligibility from proficiency-adapters instead.
 *
 * Kept for backward compatibility during migration.
 */
import { classes } from '@/data'
import type { ClassProficiencyEntry } from '@/data/classes/types'
import {
  isItemProficient,
  type EquipmentProficiency,
} from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

export type { EquipmentProficiency } from '@/features/mechanics/domain/proficiencies/proficiency-adapters'

/** @deprecated Use deriveEquipmentProficiency from proficiency-adapters instead. */
export function mergeEquipmentProficiency(
  entries: ClassProficiencyEntry[] | undefined,
): EquipmentProficiency {
  const categories: string[] = []
  const items: string[] = []
  if (!entries) return { categories, items }
  for (const e of entries) {
    if (e.categories) categories.push(...e.categories)
    if (e.items) items.push(...e.items)
  }
  return { categories, items }
}

/** @deprecated Use deriveEquipmentProficiency from proficiency-adapters instead. */
export function getClassEquipmentProficiency(
  classId: string | undefined,
  edition: string | undefined,
  slot: 'weapons' | 'armor',
): EquipmentProficiency {
  const empty: EquipmentProficiency = { categories: [], items: [] }
  if (!classId || !edition) return empty

  const cls = classes.find(c => c.id === classId)
  if (!cls) return empty

  const profs = cls.proficiencies
  if (Array.isArray(profs)) return empty

  const editionProfs = profs[edition]
  if (!editionProfs) return empty

  const entries = editionProfs[slot]
  if (!entries || !Array.isArray(entries)) return empty

  return mergeEquipmentProficiency(entries)
}

/**
 * @deprecated Prefer using evaluateEquipmentEligibility per-item for
 *             richer UI (disabled + reasons) instead of hard-filtering.
 */
export const getAllowedEquipment = ({
  items,
  edition,
  proficiency,
}: {
  items: readonly any[]
  edition: string
  proficiency: EquipmentProficiency
}) => {
  if (proficiency.categories.length === 0 && proficiency.items.length === 0) return []
  return items.filter((item) => isItemProficient(item, edition, proficiency))
}
