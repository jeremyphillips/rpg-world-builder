/**
 * Single source of truth for final proficiency contribution.
 * Shared by characters and monsters.
 *
 * @param proficiencyBonus  Base bonus from the ruleset table (characters) or creature data (monsters).
 * @param proficiencyLevel  Multiplier — 1 for normal proficiency, 2 for expertise, etc.
 */
export function resolveProficiencyContribution(
  proficiencyBonus: number,
  proficiencyLevel: number,
): number {
  return proficiencyBonus * proficiencyLevel
}
