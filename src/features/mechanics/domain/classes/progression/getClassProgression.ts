import { getSystemClass } from '@/features/mechanics/domain/core/rules/systemCatalog.classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/core/rules/systemIds';
import type {
  ClassProgression,
} from '@/features/content/classes/domain/types'

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Get progression entry for a given class */
export function getClassProgression(
  classId?: string
): ClassProgression | undefined {
  if (!classId) return undefined
  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  if (!cls?.progression) return undefined
  return cls.progression
}

/** Get all progression entries for a given class */
export function getClassProgressionsByClass(
  classId?: string
): ClassProgression[] {
  if (!classId) return []
  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  return cls?.progression ?? []
}
