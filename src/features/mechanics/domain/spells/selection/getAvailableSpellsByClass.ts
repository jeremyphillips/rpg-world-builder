import { getSystemSpells } from '@/features/mechanics/domain/core/rules/systemCatalog.spells'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds'
import type { Spell } from '@/features/content/shared/domain/types'

/** Get all spells available to a given class. */
export function getAvailableSpellsByClass(classId: string): Spell[] {
  const spells = getSystemSpells(DEFAULT_SYSTEM_RULESET_ID)
  return spells.filter((spell) => spell.classes.includes(classId))
}
