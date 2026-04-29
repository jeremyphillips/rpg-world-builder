/**
 * Global proficiency bonus values for characters, monsters, and rules (5e: +0 to +6).
 * Type is derived from the tuple — change the list to update the union and bounds.
 */
export const PROFICIENCY_BONUS_VALUES = [0, 1, 2, 3, 4, 5, 6] as const;

export type ProficiencyBonus = (typeof PROFICIENCY_BONUS_VALUES)[number];

export const PROFICIENCY_BONUS_MIN = PROFICIENCY_BONUS_VALUES[0];

export const PROFICIENCY_BONUS_MAX =
  PROFICIENCY_BONUS_VALUES[PROFICIENCY_BONUS_VALUES.length - 1]!;

export function isProficiencyBonus(n: number): n is ProficiencyBonus {
  return (PROFICIENCY_BONUS_VALUES as readonly number[]).includes(n);
}
