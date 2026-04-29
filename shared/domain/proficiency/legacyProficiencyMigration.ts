/**
 * Shared pure helpers for one-way DB migration from proficiencyLevel / wrappers
 * to semantic strings. Used by scripts/migrateAuthoredProficiencyModes.ts.
 */

const EXPERTISE_GROUPS = ['skills', 'tools'] as const
const STANDARD_GROUPS = ['weapons', 'armor', 'saves'] as const

type LegacyLevel = { proficiencyLevel?: number }

function isLegacyAdjustment(v: unknown): v is LegacyLevel {
  return (
    v !== null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    'proficiencyLevel' in (v as object)
  )
}

function levelToExpertiseTier(n: number): 'proficient' | 'expertise' | null {
  if (n === 1) return 'proficient'
  if (n === 2) return 'expertise'
  return null
}

function levelToStandardTier(n: number): 'proficient' | null {
  if (n === 1) return 'proficient'
  return null
}

export type LegacyProficiencyMigrationReport = {
  invalidLegacyExpertiseInStandardGroup: { path: string; detail: string }[]
}

export function migrateProficiencyMapValue(
  group: string,
  key: string,
  value: unknown,
  path: string,
  report: LegacyProficiencyMigrationReport,
): unknown {
  if (typeof value === 'string') {
    if (value === 'proficient' || value === 'expertise') {
      if (
        STANDARD_GROUPS.includes(group as (typeof STANDARD_GROUPS)[number]) &&
        value === 'expertise'
      ) {
        report.invalidLegacyExpertiseInStandardGroup.push({
          path,
          detail: `expertise not allowed for ${group}.${key}`,
        })
        return 'proficient'
      }
    }
    return value
  }

  if (isLegacyAdjustment(value)) {
    const n = value.proficiencyLevel ?? 0
    if (EXPERTISE_GROUPS.includes(group as (typeof EXPERTISE_GROUPS)[number])) {
      return levelToExpertiseTier(n)
    }
    if (n === 2) {
      report.invalidLegacyExpertiseInStandardGroup.push({
        path,
        detail: `legacy proficiencyLevel 2 in standard group ${group}.${key} — coerced to proficient`,
      })
      return 'proficient'
    }
    return levelToStandardTier(n)
  }

  return value
}

export function migrateProficiencyGroupRecord(
  group: string,
  rec: Record<string, unknown>,
  pathPrefix: string,
  report: LegacyProficiencyMigrationReport,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(rec)) {
    const next = migrateProficiencyMapValue(group, k, v, `${pathPrefix}.${k}`, report)
    if (next !== null && next !== undefined) out[k] = next as unknown
  }
  return out
}

export function migrateProficienciesObject(
  raw: unknown,
  pathPrefix: string,
  report: LegacyProficiencyMigrationReport,
): Record<string, unknown> | undefined {
  if (raw === undefined || raw === null) return undefined
  if (typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  const next: Record<string, unknown> = { ...o }
  for (const g of [...EXPERTISE_GROUPS, ...STANDARD_GROUPS]) {
    const block = o[g]
    if (block !== undefined && block !== null && typeof block === 'object' && !Array.isArray(block)) {
      next[g] = migrateProficiencyGroupRecord(g, block as Record<string, unknown>, `${pathPrefix}.${g}`, report)
    }
  }
  return next
}

export function migrateCharacterSkillsRecord(
  skills: unknown,
  pathPrefix: string,
  report: LegacyProficiencyMigrationReport,
): unknown {
  if (skills === undefined) return undefined
  if (Array.isArray(skills)) {
    const rec: Record<string, string> = {}
    for (const id of skills) {
      if (typeof id === 'string') rec[id] = 'proficient'
    }
    return rec
  }
  if (typeof skills === 'object' && skills !== null && !Array.isArray(skills)) {
    return migrateProficiencyGroupRecord('skills', skills as Record<string, unknown>, `${pathPrefix}.skills`, report)
  }
  return skills
}
