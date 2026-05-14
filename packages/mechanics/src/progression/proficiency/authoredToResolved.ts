import type {
  AuthoredExpertiseProficiency,
  AuthoredStandardProficiency,
} from '@/shared/domain/proficiency/authoredCreatureProficiencies'
import type { ResolvedProficiencyMode } from './resolvedProficiencyMode'

export function authoredExpertiseToResolved(
  value: AuthoredExpertiseProficiency | undefined,
): ResolvedProficiencyMode {
  if (value === undefined) return 'none'
  if (value === 'expertise') return 'expertise'
  return 'proficient'
}

export function authoredStandardToResolved(
  value: AuthoredStandardProficiency | undefined,
): ResolvedProficiencyMode {
  if (value === undefined) return 'none'
  return 'proficient'
}
