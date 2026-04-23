/**
 * Rules-aligned authored proficiency values per group.
 * Armor, weapons, and saves cannot be expertise at the type level.
 */

export type AuthoredStandardProficiency = 'proficient'

export type AuthoredExpertiseProficiency = 'proficient' | 'expertise'

export type CreatureProficiencyGroups = {
  skills?: Partial<Record<string, AuthoredExpertiseProficiency>>
  tools?: Partial<Record<string, AuthoredExpertiseProficiency>>
  weapons?: Partial<Record<string, AuthoredStandardProficiency>>
  armor?: Partial<Record<string, AuthoredStandardProficiency>>
  saves?: Partial<Record<string, AuthoredStandardProficiency>>
}

const EXPERTISE_GROUPS = new Set(['skills', 'tools'])
const STANDARD_GROUPS = new Set(['weapons', 'armor', 'saves'])

const isExpertiseValue = (v: unknown): v is AuthoredExpertiseProficiency =>
  v === 'proficient' || v === 'expertise'

const isStandardValue = (v: unknown): v is AuthoredStandardProficiency => v === 'proficient'

export type CreatureProficiencyValidationError = { path: string; message: string }

function validateGroupMap(
  group: string,
  value: unknown,
  allowExpertise: boolean,
  basePath: string,
): CreatureProficiencyValidationError[] {
  if (value === undefined) return []
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [{ path: basePath, message: `${group} must be an object map` }]
  }
  const errors: CreatureProficiencyValidationError[] = []
  for (const [key, v] of Object.entries(value)) {
    const p = `${basePath}.${key}`
    if (allowExpertise) {
      if (!isExpertiseValue(v)) {
        errors.push({
          path: p,
          message: `expected 'proficient' | 'expertise' for ${group} entry`,
        })
      }
    } else if (!isStandardValue(v)) {
      errors.push({
        path: p,
        message: `expected 'proficient' only for ${group} entry (expertise is not valid)`,
      })
    }
  }
  return errors
}

/**
 * Validates parsed proficiency JSON. Unknown top-level keys are ignored.
 */
export function validateCreatureProficiencyGroups(
  value: unknown,
  pathPrefix = 'mechanics.proficiencies',
): CreatureProficiencyValidationError[] {
  if (value === undefined || value === null) return []
  if (typeof value !== 'object' || Array.isArray(value)) {
    return [{ path: pathPrefix, message: 'proficiencies must be an object' }]
  }
  const errors: CreatureProficiencyValidationError[] = []
  const o = value as Record<string, unknown>
  for (const key of Object.keys(o)) {
    if (EXPERTISE_GROUPS.has(key)) {
      errors.push(...validateGroupMap(key, o[key], true, `${pathPrefix}.${key}`))
    } else if (STANDARD_GROUPS.has(key)) {
      errors.push(...validateGroupMap(key, o[key], false, `${pathPrefix}.${key}`))
    }
  }
  return errors
}
