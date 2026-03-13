import type { CharacterProficiencies, ProficiencyAdjustment } from '@/features/character/domain/types'

/**
 * Extract skill IDs from proficiencies (record shape).
 * Returns empty array for undefined or empty skills.
 */
export function getSkillIds(proficiencies: CharacterProficiencies | undefined): string[] {
  const skills = proficiencies?.skills
  if (!skills || typeof skills !== 'object' || Array.isArray(skills)) return []
  return Object.keys(skills)
}

/**
 * Convert array of skill IDs to record shape with proficiencyLevel: 1 per entry.
 */
export function toSkillProficienciesRecord(ids: string[]): Record<string, ProficiencyAdjustment> {
  return Object.fromEntries(ids.map((id) => [id, { proficiencyLevel: 1 }]))
}
