import { getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import { getSubclassNameById } from '@/features/mechanics/domain/classes/progression'

export interface CharacterForLabel {
  name: string
  level?: number
  totalLevel?: number
  class?: string
  classes?: { classId?: string; subclassId?: string; level: number }[]
}

/**
 * Builds a display label for a character option.
 * Format: "{name} (Lvl {level} {class})" or multiclass: "{name} (Lvl {level} {class}, Lvl {level} {class})"
 */
export function getCharacterOptionLabel(c: CharacterForLabel): string {
  const name = c.name ?? 'Unnamed'

  if (c.classes && c.classes.length > 0) {
    const parts = c.classes.map((cls) => {
      const className = getClassName(cls.classId, cls.subclassId)
      return `Lvl ${cls.level} ${className}`
    })
    return `${name} (${parts.join(', ')})`
  }

  const level = c.totalLevel ?? c.level ?? 1
  const className = c.class ?? 'Unknown'
  return `${name} (Lvl ${level} ${className})`
}

function getClassName(classId?: string, subclassId?: string): string {
  if (!classId) return 'Unknown'
  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  const baseName = cls?.name ?? classId
  if (subclassId) {
    const subName = getSubclassNameById(classId, subclassId)
    return subName ? `${baseName} (${subName})` : baseName
  }
  return baseName
}
