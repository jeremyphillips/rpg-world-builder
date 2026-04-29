import { describe, expect, it } from 'vitest';

import type { Spell } from '@/features/content/spells/domain/types';

import {
  buildSpellPatchDriverBase,
  normalizeSpellPatchInitialPatch,
} from './spellPatchDriverBase';

describe('spellPatchDriverBase', () => {
  it('buildSpellPatchDriverBase expands domain damage into draft fields for dot-path UI', () => {
    const spell = {
      id: 's1',
      name: 'Test',
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '2d6+1', damageType: 'fire' }],
        },
      ],
    } as unknown as Spell;

    const base = buildSpellPatchDriverBase(spell);
    const row = (base.effectGroups as { effects: { damageDiceCount?: string }[] }[])[0].effects[0];

    expect(row.damageDiceCount).toBe('2');
    expect((row as { damageModifier?: string }).damageModifier).toBe('1');
  });

  it('normalizeSpellPatchInitialPatch converts domain-shaped effectGroups in saved patch', () => {
    const patch = {
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '1d4' }],
        },
      ],
    };

    const next = normalizeSpellPatchInitialPatch(patch);
    const row = (next.effectGroups as { effects: { damageDieFace?: string }[] }[])[0].effects[0];
    expect(row.damageDieFace).toBe('4');
  });

  it('normalizeSpellPatchInitialPatch leaves form-shaped effectGroups unchanged', () => {
    const patch = {
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              kind: 'damage',
              damageFormat: 'dice',
              damageDiceCount: '9',
              damageDieFace: '6',
              damageModifier: '',
              damageFlatValue: '',
              damageType: '',
            },
          ],
        },
      ],
    };

    const next = normalizeSpellPatchInitialPatch(patch);
    expect((next.effectGroups as typeof patch.effectGroups)[0].effects[0].damageDiceCount).toBe(
      '9',
    );
  });
});
