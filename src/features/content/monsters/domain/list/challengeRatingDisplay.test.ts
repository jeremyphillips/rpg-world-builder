import { describe, expect, it } from 'vitest';

import {
  deriveSortedChallengeRatingSteps,
  formatChallengeRatingDisplay,
} from './challengeRatingDisplay';
import type { MonsterListRow } from './monsterList.types';

describe('formatChallengeRatingDisplay', () => {
  it('formats fractional CRs', () => {
    expect(formatChallengeRatingDisplay(0)).toBe('0');
    expect(formatChallengeRatingDisplay(0.125)).toBe('1/8');
    expect(formatChallengeRatingDisplay(0.25)).toBe('1/4');
    expect(formatChallengeRatingDisplay(0.5)).toBe('1/2');
    expect(formatChallengeRatingDisplay(12)).toBe('12');
  });
});

describe('deriveSortedChallengeRatingSteps', () => {
  it('reads lore.challengeRating from rows', () => {
    const rows = [
      { lore: { challengeRating: 1 } },
      { lore: { challengeRating: 0.25 } },
      { lore: { challengeRating: 1 } },
    ] as MonsterListRow[];
    expect(deriveSortedChallengeRatingSteps(rows)).toEqual([0.25, 1]);
  });
});
