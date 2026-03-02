/**
 * Engine-owned class eligibility rules.
 *
 * Determines whether a character draft is eligible for a given class,
 * returning structured reason codes instead of display strings.
 * UI maps codes to friendly copy.
 */
import { classes } from '@/data'
import { getById } from '@/utils'
import type { ClassRequirement } from '@/data'
import type { AlignmentId } from '@/data'
import type { BuildDraft } from '../types'

// ---------------------------------------------------------------------------
// Reason codes
// ---------------------------------------------------------------------------

export type ClassEligibilityReason =
  | { code: 'race_not_allowed' }
  | { code: 'alignment_not_allowed' }
  | { code: 'missing_race' }
  | { code: 'missing_alignment' }

export type ClassEligibilityResult = {
  allowed: boolean
  reasons: ClassEligibilityReason[]
}

// ---------------------------------------------------------------------------
// Core evaluator
// ---------------------------------------------------------------------------

/**
 * Evaluate whether a class is eligible for a given character draft.
 *
 * Returns structured reason codes; callers map to display strings.
 * An empty `reasons` array means the class is allowed.
 */
export function evaluateClassEligibility(
  classId: string | undefined,
  draft: BuildDraft
): ClassEligibilityResult {
  if (!classId) return { allowed: true, reasons: [] }

  const { race, alignment } = draft

  const cls = getById(classes, classId)
  if (!cls || !cls.requirements) return { allowed: true, reasons: [] }

  const req = cls.requirements

  if (!req) return { allowed: true, reasons: [] }

  const reasons: ClassEligibilityReason[] = []

  if (req.allowedRaces !== 'all') {
    if (!race) {
      reasons.push({ code: 'missing_race' })
    } else if (!req.allowedRaces.includes(race)) {
      reasons.push({ code: 'race_not_allowed' })
    }
  }

  if (req.allowedAlignments !== 'any') {
    if (!alignment) {
      reasons.push({ code: 'missing_alignment' })
    } else if (!req.allowedAlignments.includes(alignment as AlignmentId)) {
      reasons.push({ code: 'alignment_not_allowed' })
    }
  }

  // TODO: minStats check once ability scores are wired in

  return { allowed: reasons.length === 0, reasons }
}

// ---------------------------------------------------------------------------
// Requirement lookup (engine-internal, exposed for callers that need
// raw requirement data — e.g. startingWealth, equipment restrictions)
// ---------------------------------------------------------------------------

export function getClassRequirement(
  classId?: string,
): ClassRequirement | undefined {
  if (!classId) return undefined

  const cls = getById(classes, classId)
  if (!cls) return undefined

  return cls.requirements
}

// ---------------------------------------------------------------------------
// Restriction notes (human-readable, for informational display)
// ---------------------------------------------------------------------------

/**
 * Generate human-readable restriction notes for a set of classes in an edition.
 * Surfaces race-as-class restrictions as grouped informational notes.
 */
export function getClassRestrictionNotes(
  classIds: string[]
): string[] {
  const notes: string[] = []
  const humanOnly: string[] = []
  const openToAll: string[] = []

  for (const classId of classIds) {
    const cls = getById(classes, classId)
    if (!cls) continue

    const req = cls.requirements
    if (!req) continue

    if (req.allowedRaces === 'all') {
      openToAll.push(cls.name)
    } else if (
      req.allowedRaces.length === 1 &&
      req.allowedRaces[0] === 'human'
    ) {
      humanOnly.push(cls.name)
    }
  }

  if (humanOnly.length > 0 && openToAll.length > 0) {
    notes.push(
      `Only Humans may be ${humanOnly.join(', ')}. Demihumans are restricted to ${openToAll.join(', ')}.`
    )
  } else if (humanOnly.length > 0) {
    notes.push(`Only Humans may be ${humanOnly.join(', ')}.`)
  }

  return notes
}
