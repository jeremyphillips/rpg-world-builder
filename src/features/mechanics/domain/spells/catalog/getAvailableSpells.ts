import { spellCatalog } from './spellCatalog'
import type { SpellWithEntry } from './types'

/** Get all spells available to a given class. */
export function getAvailableSpells(classId: string): SpellWithEntry[] {
  return spellCatalog.filter(spell => spell.classes.includes(classId))
}
