import { describe, expect, it } from 'vitest';

import { createDefaultSpellEffectFormRow } from '../assembly/spellEffectRow.assembly';
import type { SpellFormValues } from '../types/spellForm.types';
import { toSpellInput } from '../mappers/spellForm.mappers';

describe('spellForm effectGroups (nested form)', () => {
  it('toSpellInput assembles effect payloads from flat effect rows', () => {
    const baseEffect = createDefaultSpellEffectFormRow();
    const values = {
      ...({} as SpellFormValues),
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [
            {
              ...baseEffect,
              kind: 'damage',
              damageFormat: 'dice',
              damageDiceCount: '2',
              damageDieFace: '6',
              damageModifier: '',
              damageFlatValue: '',
              damageType: 'fire',
            },
            { ...baseEffect, kind: 'condition', conditionId: 'frightened' },
          ],
        },
      ],
    } as SpellFormValues;

    const input = toSpellInput(values);
    expect(input.effectGroups).toEqual([
      {
        targeting: { selection: 'one', targetType: 'creature' },
        effects: [
          { kind: 'damage', damage: '2d6', damageType: 'fire' },
          { kind: 'condition', conditionId: 'frightened' },
        ],
      },
    ]);
  });
});
