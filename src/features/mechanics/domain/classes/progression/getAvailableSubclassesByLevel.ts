import { classes } from '@/data/classes'
import type { Subclass } from '@/features/classes/domain/types'
import { getById } from '@/utils'

export const getAvailableSubclassesByLevel = (
  classId?: string,
  level: number = 1
): Subclass[] => {
  if (!classId) return []

  const cls = getById(classes, classId)
  if (!cls) return []

  const definitions = cls.definitions
  const selectionLevel = definitions?.selectionLevel

  if (selectionLevel && level >= selectionLevel) {
    return definitions?.options ?? []
  }

  return []
}

