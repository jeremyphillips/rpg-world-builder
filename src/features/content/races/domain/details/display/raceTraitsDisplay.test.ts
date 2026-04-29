import { describe, expect, it } from 'vitest';

import type { Race } from '@/features/content/races/domain/types';

import {
  formatRaceBaseTraits,
  formatRaceDefinitionOptionTraits,
  formatRaceTraitEntry,
  formatRaceTraitUsesLine,
  hasRaceBaseTraits,
  hasRaceDefinitionTraits,
} from './raceTraitsDisplay';

describe('formatRaceTraitUsesLine', () => {
  it('formats count and period', () => {
    expect(formatRaceTraitUsesLine({ count: 2, period: 'day' })).toBe('2/day');
  });

  it('returns undefined when absent', () => {
    expect(formatRaceTraitUsesLine(undefined)).toBeUndefined();
  });
});

describe('formatRaceTraitEntry', () => {
  it('includes name, description, and notes', () => {
    const text = formatRaceTraitEntry({
      id: 't1',
      name: 'Gnomish Cunning',
      description: 'Advantage on mental saves vs magic.',
      notes: 'SRD 5.2.1',
    });
    expect(text).toContain('Gnomish Cunning');
    expect(text).toContain('Advantage on mental');
    expect(text).toContain('SRD 5.2.1');
  });

  it('appends uses to the title', () => {
    const text = formatRaceTraitEntry({
      id: 't2',
      name: 'Foo',
      description: 'Bar.',
      uses: { count: 1, period: 'day' },
    });
    expect(text.startsWith('Foo (1/day)')).toBe(true);
  });
});

describe('formatRaceBaseTraits / formatRaceDefinitionOptionTraits', () => {
  it('formats base grants only', () => {
    const race = {
      grants: {
        traits: [{ id: 'a', name: 'A', description: 'Desc A' }],
      },
    } as Race;
    expect(hasRaceBaseTraits(race)).toBe(true);
    expect(formatRaceBaseTraits(race)).toContain('Desc A');
  });

  it('formats definition option trait blocks with group: option headers', () => {
    const race = {
      definitionGroups: [
        {
          id: 'g',
          name: 'Elven Lineage',
          kind: 'lineage' as const,
          selectionLevel: 1,
          options: [
            {
              id: 'drow',
              name: 'Drow',
              grants: {
                traits: [{ id: 'm', name: 'Drow Magic', description: 'Spells.' }],
              },
            },
          ],
        },
      ],
    } as Race;
    expect(hasRaceDefinitionTraits(race)).toBe(true);
    const out = formatRaceDefinitionOptionTraits(race);
    expect(out).toContain('Elven Lineage: Drow');
    expect(out).toContain('Drow Magic');
    expect(out).toContain('Spells.');
  });
});
