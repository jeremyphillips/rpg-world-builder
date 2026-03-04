import { getById } from '@/utils'
import { classes } from '@/data/classes'

/** Resolve subclass display name by class id and definition id. */
export function getSubclassNameById(classId?: string, subclassId?: string): string | null {
  if (!classId || !subclassId) return null
  const cls = getById(classes, classId)
  if (!cls) return subclassId

  const opt = cls.definitions?.options?.find(o => o.id === subclassId)
  return opt?.name ?? subclassId
}