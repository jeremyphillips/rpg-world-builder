/**
 * 5e proficiency bonus by character level.
 * Level 1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6.
 */
export function getProficiencyAttackBonus(level: number): number {
  if (level <= 0) return 0
  return Math.ceil(level / 4) + 1
}
