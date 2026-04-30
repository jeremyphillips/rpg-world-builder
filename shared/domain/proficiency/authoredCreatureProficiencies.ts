/**
 * Rules-aligned authored proficiency values per group.
 * Skills and tools support expertise; weapons, armor, and saves are ID lists (presence = proficient).
 */

export type AuthoredStandardProficiency = 'proficient'

export type AuthoredExpertiseProficiency = 'proficient' | 'expertise'

/** Skill/tool id → tier */
export type CreatureExpertiseProficiencyMap = Partial<Record<string, AuthoredExpertiseProficiency>>

export type CreatureProficiencyGroups = {
  skills?: CreatureExpertiseProficiencyMap
  tools?: CreatureExpertiseProficiencyMap
  weapons?: string[]
  armor?: string[]
  saves?: string[]
}

const EXPERTISE_GROUPS = new Set(['skills', 'tools'])
const STANDARD_GROUPS = ['weapons', 'armor', 'saves'] as const

const isExpertiseValue = (v: unknown): v is AuthoredExpertiseProficiency =>
  v === 'proficient' || v === 'expertise'

function dedupePreserveOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

/**
 * Normalizes weapons / armor / saves from string[] or legacy `Record<id, 'proficient' | …>`
 * into a deduped ID list. Undefined/null input → undefined.
 */
export function normalizeStandardProficiencyIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined
  if (Array.isArray(value)) {
    const ids = value.filter((x): x is string => typeof x === 'string' && x.length > 0)
    return dedupePreserveOrder(ids)
  }
  if (typeof value !== 'object') return undefined

  const seen = new Set<string>()
  const out: string[] = []
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === 'string') {
      if (v === 'proficient' || v === 'expertise') {
        if (!seen.has(k)) {
          seen.add(k)
          out.push(k)
        }
      }
      continue
    }
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && 'proficiencyLevel' in v) {
      const n = (v as { proficiencyLevel?: number }).proficiencyLevel ?? 0
      if (n >= 1 && !seen.has(k)) {
        seen.add(k)
        out.push(k)
      }
    }
  }
  return out
}

export function hasCreatureStandardProficiency(list: unknown, id: string): boolean {
  const ids = normalizeStandardProficiencyIds(list)
  return ids !== undefined && ids.includes(id)
}

/**
 * Hydration helper for campaign/API monsters: coerce legacy record-shaped standard groups to arrays.
 */
export function normalizeAuthoredCreatureProficienciesForRead(
  raw: unknown,
): Partial<CreatureProficiencyGroups> | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const next: Record<string, unknown> = { ...o }
  for (const g of STANDARD_GROUPS) {
    if (!(g in o)) continue
    const normalized = normalizeStandardProficiencyIds(o[g])
    if (normalized !== undefined) next[g] = normalized
  }
  return next as Partial<CreatureProficiencyGroups>
}

export type CreatureProficiencyValidationError = { path: string; message: string }

function validateGroupMap(
  group: string,
  value: unknown,
  basePath: string,
): CreatureProficiencyValidationError[] {
  if (value === undefined) return []
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [{ path: basePath, message: `${group} must be an object map` }]
  }
  const errors: CreatureProficiencyValidationError[] = []
  for (const [key, v] of Object.entries(value)) {
    const p = `${basePath}.${key}`
    if (!isExpertiseValue(v)) {
      errors.push({
        path: p,
        message: `expected 'proficient' | 'expertise' for ${group} entry`,
      })
    }
  }
  return errors
}

function validateGroupIdList(
  group: string,
  value: unknown,
  basePath: string,
): CreatureProficiencyValidationError[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    return [{ path: basePath, message: `${group} must be an array of string ids` }]
  }
  const errors: CreatureProficiencyValidationError[] = []
  value.forEach((entry, i) => {
    if (typeof entry !== 'string' || entry.length === 0) {
      errors.push({
        path: `${basePath}[${i}]`,
        message: `${group} entries must be non-empty strings`,
      })
    }
  })
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
      errors.push(...validateGroupMap(key, o[key], `${pathPrefix}.${key}`))
    } else if ((STANDARD_GROUPS as readonly string[]).includes(key)) {
      errors.push(...validateGroupIdList(key, o[key], `${pathPrefix}.${key}`))
    }
  }
  return errors
}
