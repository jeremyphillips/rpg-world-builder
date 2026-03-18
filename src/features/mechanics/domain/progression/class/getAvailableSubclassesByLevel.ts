import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import type { Subclass } from '@/features/content/classes/domain/types'

export const getAvailableSubclassesByLevel = (
  classId?: string,
  level: number = 1
): Subclass[] => {
  if (!classId) return []

  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  if (!cls) return []

  const definitions = cls.definitions
  const selectionLevel = definitions?.selectionLevel

  if (selectionLevel && level >= selectionLevel) {
    return definitions?.options ?? []
  }

  return []
}
