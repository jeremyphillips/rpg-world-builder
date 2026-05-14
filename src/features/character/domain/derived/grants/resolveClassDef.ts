import type { CharacterClass } from '@/features/content/classes/domain/types'
import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes'
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds'
import type { SystemRulesetId } from '@/features/mechanics/domain/rulesets/types/ruleset.types'

export type ResolveClassDefOptions = {
  /** Merged campaign + system classes; homebrew entries should live here. */
  classesById?: ReadonlyMap<string, CharacterClass>
  rulesetId?: SystemRulesetId
}

/**
 * Resolve a class definition for grant extraction: campaign map first, then system catalog.
 */
export function resolveClassDef(
  classId: string,
  options: ResolveClassDefOptions = {},
): CharacterClass | undefined {
  const { classesById, rulesetId = DEFAULT_SYSTEM_RULESET_ID } = options
  return classesById?.get(classId) ?? getSystemClass(rulesetId, classId)
}
