import { getById } from '@/domain/lookups'
import { classes } from '@/data'

export const getSubclassUnlockLevel = (
  classId?: string,
  edition?: string
): number | null => {
  if (!classId || !edition) return null

  const cls = getById(classes, classId)
  if (!cls) return null

  const definition = cls.definitions.find(
    (d) => d.edition === edition && typeof d.selectionLevel === 'number'
  )

  return definition?.selectionLevel ?? null
}
