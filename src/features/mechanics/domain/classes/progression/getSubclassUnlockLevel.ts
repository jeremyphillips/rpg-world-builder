import { getById } from '@/utils'
import { classes } from '@/data/classes'

export const getSubclassUnlockLevel = (
  classId?: string
): number | null => {
  if (!classId) return null

  const cls = getById(classes, classId)
  if (!cls) return null

  const definition = cls.definitions

  return definition?.selectionLevel ?? null
}
