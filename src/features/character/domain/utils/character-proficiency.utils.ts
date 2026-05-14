import type { CharacterProficiencies } from '@/features/character/domain/types'
import type { AuthoredExpertiseProficiency } from '@/shared/domain/proficiency/authoredCreatureProficiencies'

/**
 * Extract skill IDs from proficiencies (record shape).
 * Returns empty array for undefined or empty skills.
 */
export function getSkillIds(proficiencies: CharacterProficiencies | undefined): string[] {
  const skills = proficiencies?.skills
  if (!skills || typeof skills !== 'object' || Array.isArray(skills)) return []
  return Object.keys(skills)
}

/** Convert array of skill IDs to proficient entries (class skill picks). */
export function toSkillProficienciesRecord(
  ids: string[],
): Record<string, AuthoredExpertiseProficiency> {
  return Object.fromEntries(ids.map((id) => [id, 'proficient' as const]))
}
