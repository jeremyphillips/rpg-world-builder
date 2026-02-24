// Determines whether a character is allowed to add another class based on
// the edition's multiclassing rules.
//
// CURRENT CHECKS:
//   1. Edition explicitly allows multiclassing (Edition.multiclassing.allowed)
//   2. Character hasn't reached the edition's maxClasses cap
//   3. There are remaining levels to allocate
//
// FUTURE CHECKS (documented for implementation later):
//
//   2e Ability Score Requirements
//   ─────────────────────────────
//   In 2e, multiclassing is restricted to demihumans and requires minimum
//   ability scores in BOTH classes.  For example:
//     - Fighter/Thief requires Str 15+ AND Dex 15+
//     - Fighter/Mage requires Str 15+ AND Int 15+
//     - Cleric/Ranger requires Wis 15+ AND Str 13+, Dex 13+, Wis 14+
//   Humans use "dual-classing" instead (different rules entirely).
//   Implementation would check `state.abilityScores` against a lookup table of
//   valid multiclass combos keyed by race + class pair.
//
//   2e/1e Race-Restricted Combinations
//   ───────────────────────────────────
//   Not all multiclass combinations are available to all races:
//     - Elves: Fighter/Mage, Fighter/Thief, Mage/Thief, Fighter/Mage/Thief
//     - Dwarves: Fighter/Thief, Fighter/Cleric
//     - Halflings: Fighter/Thief
//     - Gnomes: Fighter/Thief, Fighter/Illusionist, Cleric/Thief, etc.
//   Implementation would store valid combos per race in the class
//   requirements data and filter available secondary classes accordingly.
//
//   3e/3.5e XP Penalty
//   ──────────────────
//   3e penalizes multiclassing when class levels are unbalanced (>1 level
//   difference between any two non-favored classes).  This is a display
//   concern (showing a warning) rather than a hard restriction.

import type { MulticlassingRules } from '@/data/ruleSets'

export interface CanMulticlassResult {
  /** Whether the "Add another class" action should be available */
  allowed: boolean
  /** Human-readable reason when disallowed (for UI display) */
  reason?: string
}

/**
 * Determines whether a character can add another class.
 *
 * @param edition         - Current edition ID
 * @param currentClasses  - Number of classes the character already has
 * @param remainingLevels - Levels still available to allocate
 */
export const canAddClass = (
  multiClassingRules: MulticlassingRules,
  currentClasses: number,
  remainingLevels: number
): CanMulticlassResult => {
  // --- Check 1: Does this ruleset support multiclassing at all? ---
  if (!multiClassingRules.enabled) {
    return {
      allowed: false,
      reason: `Campaign does not support multiclassing`
    }
  }

  // --- Check 2: Has the character hit the ruleset's class cap? ---
  const maxClasses = multiClassingRules?.maxClasses ?? null
  if (maxClasses != null && currentClasses >= maxClasses) {
    return {
      allowed: false,
      reason: `Campaign allows a maximum of ${maxClasses} classes`
    }
  }

  // --- Check 3: Are there levels left to allocate? ---
  if (remainingLevels <= 0) {
    return {
      allowed: false,
      reason: 'No remaining levels to allocate'
    }
  }

  return { allowed: true }
}
