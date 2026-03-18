import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';

/** Resolve subclass display name by class id and definition id. */
export function getSubclassNameById(classId?: string, subclassId?: string): string | null {
  if (!classId || !subclassId) return null
  const cls = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, classId)
  if (!cls) return subclassId

  const opt = cls.definitions?.options?.find(o => o.id === subclassId)
  return opt?.name ?? subclassId
}
