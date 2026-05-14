import { describe, expect, it } from 'vitest';
import type { Ruleset } from '@/shared/types/ruleset';
import {
  getAlignmentFormSelectOptions,
  getAlignmentFormSelectOptionsForOptionSetId,
  getAlignmentFormSelectOptionsForRuleset,
  resolveAlignmentOptionSetIdFromRuleset,
} from './alignment.vocab';

describe('alignment.vocab (ruleset-driven selects)', () => {
  it('defaults to nine_point when ruleset is missing', () => {
    expect(resolveAlignmentOptionSetIdFromRuleset(undefined)).toBe('nine_point');
    const opts = getAlignmentFormSelectOptionsForRuleset(undefined);
    expect(opts).toHaveLength(9);
    expect(opts.map((o) => o.value)).toContain('n');
  });

  it('uses mechanics.character.alignment.optionSetId from the resolved ruleset', () => {
    const fivePoint: Pick<Ruleset, 'mechanics'> = {
      mechanics: {
        progression: {} as Ruleset['mechanics']['progression'],
        combat: {} as Ruleset['mechanics']['combat'],
        character: {
          alignment: {
            enabled: true,
            optionSetId: 'five_point',
            defaultId: 'unaligned',
          },
        },
      },
    };
    expect(resolveAlignmentOptionSetIdFromRuleset(fivePoint)).toBe('five_point');
    const opts = getAlignmentFormSelectOptionsForRuleset(fivePoint);
    expect(opts).toHaveLength(5);
    expect(opts.map((o) => o.value)).toEqual(['lg', 'good', 'unaligned', 'evil', 'ce']);
  });

  it('getAlignmentFormSelectOptionsForOptionSetId returns three_point axis set', () => {
    const opts = getAlignmentFormSelectOptionsForOptionSetId('three_point');
    expect(opts).toHaveLength(3);
    expect(opts.map((o) => o.value)).toEqual(['law', 'neutral', 'chaos']);
  });

  it('getAlignmentFormSelectOptions matches the nine_point default (legacy API)', () => {
    const legacy = getAlignmentFormSelectOptions();
    const nine = getAlignmentFormSelectOptionsForOptionSetId('nine_point');
    expect(legacy).toEqual(nine);
  });
});
