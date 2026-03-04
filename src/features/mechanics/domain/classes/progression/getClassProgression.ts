import { classes } from '@/data/classes'
import type {
  ClassProgression,
} from '@/features/classes/domain/types'
import { getById } from '@/utils'



// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get progression entry for a given class */
export function getClassProgression(
  classId?: string
): ClassProgression | undefined {
  if (!classId) return undefined
  const cls = getById(classes, classId)
  if (!cls?.progression) return undefined
  return cls.progression
}

/** Get all progression entries for a given class */
export function getClassProgressionsByClass(
  classId?: string
): ClassProgression[] {
  if (!classId) return []
  const cls = getById(classes, classId)
  return cls?.progression ?? []
}
