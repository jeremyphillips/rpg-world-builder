import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';

import { formatMonsterChallengeRatingLine } from './monsterChallengeRatingDisplay';

describe('formatMonsterChallengeRatingLine', () => {
  it('formats CR with XP and PB for skeleton', () => {
    const m = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'skeleton');
    expect(m).toBeDefined();
    expect(formatMonsterChallengeRatingLine(m!)).toBe('1/4 (XP 50; PB +2)');
  });

  it('includes CR 0 with XP and PB', () => {
    const m = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'awakened-shrub');
    expect(m).toBeDefined();
    expect(formatMonsterChallengeRatingLine(m!)).toBe('0 (XP 10; PB +2)');
  });
});
