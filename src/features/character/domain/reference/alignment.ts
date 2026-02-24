import type { CharacterClass } from '@/data/classes/types'
import type { AlignmentOption as RulesetAlignmentOption } from '@/data/ruleSets'

export type AlignmentOption = {
  id: string
  label: string
  disabled: boolean
}

/**
 * Build alignment options for a character, disabling any alignments
 * that conflict with class requirements.
 *
 * @param classIds          The character's selected class IDs
 * @param rulesetOptions    Alignment options from the ruleset (id + name)
 * @param classesById       Catalog class definitions (keyed by id)
 */
export const getAlignmentOptionsForCharacter = (
  classIds: string[],
  rulesetOptions: RulesetAlignmentOption[],
  classesById?: Record<string, CharacterClass>,
): AlignmentOption[] => {
  let allowed: Set<string> | null = null

  if (classIds.length > 0 && classesById) {
    for (const classId of classIds) {
      const req = classesById[classId]?.requirements
      const classAlignments = req?.allowedAlignments
      if (classAlignments === undefined) continue

      const ids: string[] =
        classAlignments === 'any'
          ? rulesetOptions.map(a => a.id)
          : (classAlignments as string[]).slice()

      const set = new Set<string>(ids)
      if (allowed === null) allowed = new Set<string>(ids)
      else allowed = new Set<string>([...allowed].filter((id: string) => set.has(id)))
    }
  }

  return rulesetOptions.map(a => ({
    id: a.id,
    label: a.name,
    disabled: allowed !== null ? !allowed.has(a.id) : false,
  }))
}
