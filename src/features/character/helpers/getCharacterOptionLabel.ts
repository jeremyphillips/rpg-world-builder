import { classes } from '@/data/classes'
import { getById } from '@/utils'
import { getSubclassNameById } from '@/features/character/domain/reference'

export interface CharacterForLabel {
  name: string
  level?: number
  totalLevel?: number
  class?: string
  classes?: { classId?: string; classDefinitionId?: string; level: number }[]
  edition?: string
}

/**
 * Builds a display label for a character option.
 * Format: "{name} (Lvl {level} {class})" or multiclass: "{name} (Lvl {level} {class}, Lvl {level} {class})"
 */
export function getCharacterOptionLabel(c: CharacterForLabel): string {
  const name = c.name ?? 'Unnamed'

  if (c.classes && c.classes.length > 0) {
    const parts = c.classes.map((cls) => {
      const className = getClassName(cls.classId, cls.classDefinitionId)
      return `Lvl ${cls.level} ${className}`
    })
    return `${name} (${parts.join(', ')})`
  }

  const level = c.totalLevel ?? c.level ?? 1
  const className = c.class ?? 'Unknown'
  return `${name} (Lvl ${level} ${className})`
}

function getClassName(classId?: string, classDefinitionId?: string): string {
  if (!classId) return 'Unknown'
  const cls = getById(classes, classId)
  const baseName = cls?.name ?? classId
  if (classDefinitionId) {
    const subName = getSubclassNameById(classId, classDefinitionId)
    return subName ? `${baseName} (${subName})` : baseName
  }
  return baseName
}
