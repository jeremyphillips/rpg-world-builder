import type { ProficiencyBonusTier } from '@/shared/types/ruleset';

/**
 * 5e character proficiency bonus by level tier.
 * Level 1–4: +2, 5–8: +3, 9–12: +4, 13–16: +5, 17–20: +6.
 */
export const CHARACTER_PROFICIENCY_BONUS_TABLE: readonly ProficiencyBonusTier[] = [
  { levelRange: [1, 4], bonus: 2 },
  { levelRange: [5, 8], bonus: 3 },
  { levelRange: [9, 12], bonus: 4 },
  { levelRange: [13, 16], bonus: 5 },
  { levelRange: [17, 20], bonus: 6 },
] as const;
