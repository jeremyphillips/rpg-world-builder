import { classesCore } from '@/data'
import type { SubclassOption } from '@/data/classes/types'
import { getById } from '@/domain/lookups'

export const getClassDefinitions = (
  classId?: string,
  level: number = 1
): SubclassOption[] => {
  if (!classId) return []

  const cls = getById(classesCore, classId)
  if (!cls) return []

  const definitions = cls.definitions
  const selectionLevel = definitions?.selectionLevel

  if (selectionLevel && level >= selectionLevel) {
    return definitions?.options ?? []
  }

  return []
}

/** Resolve subclass display name by class id and definition id. */
export function getSubclassNameById(classId?: string, defId?: string): string | null {
  if (!classId || !defId) return null
  const cls = getById(classesCore, classId)
  if (!cls) return defId

  const opt = cls.definitions?.options?.find(o => o.id === defId)
  return opt?.name ?? defId
}
