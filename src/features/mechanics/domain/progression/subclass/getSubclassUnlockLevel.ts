import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';

export const getSubclassUnlockLevel = (
  classId?: string
): number | null => {
  if (!classId) return null

  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  if (!cls) return null

  const definition = cls.definitions

  return definition?.selectionLevel ?? null
}
