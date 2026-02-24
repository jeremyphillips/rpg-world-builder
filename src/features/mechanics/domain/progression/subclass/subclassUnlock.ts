import { getById } from '@/domain/lookups'
import { classesCore } from '@/data'

export const getSubclassUnlockLevel = (
  classId?: string
): number | null => {
  if (!classId) return null

  const cls = getById(classesCore, classId)
  if (!cls) return null

  const definition = cls.definitions
  // const definition = cls.definitions.find(
  //   (d) => d.edition === edition && typeof d.selectionLevel === 'number'
  // )

  return definition?.selectionLevel ?? null
}
