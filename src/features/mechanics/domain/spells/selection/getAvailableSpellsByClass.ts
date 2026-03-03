import { spellCatalog } from '../catalog/spellCatalog'
import type { Spell } from '@/features/content/domain/types/spell.types'

/** Get all spells available to a given class. */
export function getAvailableSpellsByClass(classId: string): Spell[] {
  return spellCatalog.filter(spell => spell.classes.includes(classId))
}
