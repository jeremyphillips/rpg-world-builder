import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import { getSubclassNameById } from '@/features/mechanics/domain/progression/subclass'

export interface CharacterForLabel {
  name: string
  level?: number
  totalLevel?: number
  class?: string
  classes?: {
    classId?: string
    subclassId?: string | null
    level: number
    /** Resolved class name (avoids catalog lookup when present) */
    className?: string
    /** Resolved subclass name (avoids catalog lookup when present) */
    subclassName?: string | null
  }[]
}

/**
 * Builds a display label for a character option.
 * Format: "{name} (Lvl {level} {class})" or multiclass: "{name} (Lvl {level} {class}, Lvl {level} {class})"
 * Uses className/subclassName when present to avoid catalog lookups.
 */
export function getCharacterOptionLabel(c: CharacterForLabel): string {
  const name = c.name ?? 'Unnamed'

  if (c.classes && c.classes.length > 0) {
    const parts = c.classes.map((cls) => {
      const displayName =
        cls.className != null
          ? cls.subclassName
            ? `${cls.className} (${cls.subclassName})`
            : cls.className
          : getClassName(cls.classId, cls.subclassId ?? undefined)
      return `Lvl ${cls.level} ${displayName}`
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
