import { deriveSortedUniqueNumericSteps } from '@/features/content/shared/toolbar/discreteNumericRange';

import type { MonsterListRow } from './monsterList.types';

/**
 * D&D-style challenge rating labels for toolbars, filters, and badges.
 */
export function formatChallengeRatingDisplay(n: number): string {
  if (n === 0.125) return '1/8';
  if (n === 0.25) return '1/4';
  if (n === 0.5) return '1/2';
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

export function deriveSortedChallengeRatingSteps(rows: MonsterListRow[]): number[] {
  return deriveSortedUniqueNumericSteps(rows, (r) => r.lore?.challengeRating);
}
