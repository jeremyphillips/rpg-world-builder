import { getById } from '@/utils'
import { classes } from '@/data'

export const getSubclassUnlockLevel = (
  classId?: string
): number | null => {
  if (!classId) return null

  const cls = getById(classes, classId)
  if (!cls) return null

  const definition = cls.definitions
  // const definition = cls.definitions.find(
  //   (d) => d.edition === edition && typeof d.selectionLevel === 'number'
  // )

  return definition?.selectionLevel ?? null
}
