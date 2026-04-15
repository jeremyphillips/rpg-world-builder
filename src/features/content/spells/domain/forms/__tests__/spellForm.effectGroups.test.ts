import { describe, expect, it } from 'vitest';

import type { SpellFormValues } from '../types/spellForm.types';
import { toSpellInput } from '../mappers/spellForm.mappers';

describe('spellForm effectGroups (nested form)', () => {
  it('toSpellInput passes effectGroups array through', () => {
    const values = {
      ...({} as SpellFormValues),
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage' }, { kind: 'condition' }],
        },
      ],
    } as SpellFormValues;

    const input = toSpellInput(values);
    expect(input.effectGroups).toEqual(values.effectGroups);
  });
});
