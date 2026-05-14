import { describe, expect, it } from 'vitest';

import {
  findSpellTargetingWithArea,
  flattenSpellEffects,
  getPrimarySpellTargeting,
} from '../spellEffectGroups';
import type { SpellBase } from '../types/spell.types';

describe('spellEffectGroups helpers', () => {
  it('flattenSpellEffects concatenates group effects in order', () => {
    const spell: Pick<SpellBase, 'effectGroups'> = {
      effectGroups: [
        {
          targeting: { selection: 'one', targetType: 'creature' },
          effects: [{ kind: 'damage', damage: '1d4', damageType: 'fire' }],
        },
        {
          effects: [{ kind: 'note', text: 'rider', category: 'flavor' }],
        },
      ],
    };
    expect(flattenSpellEffects(spell).map((e) => e.kind)).toEqual(['damage', 'note']);
  });

  it('getPrimarySpellTargeting returns first group targeting', () => {
    const spell: Pick<SpellBase, 'effectGroups'> = {
      effectGroups: [
        { targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'square', size: 20 } }, effects: [] },
      ],
    };
    expect(getPrimarySpellTargeting(spell)?.area?.kind).toBe('square');
  });

  it('findSpellTargetingWithArea picks first group with an area', () => {
    const spell: Pick<SpellBase, 'effectGroups'> = {
      effectGroups: [
        { targeting: { selection: 'one', targetType: 'creature' }, effects: [] },
        { targeting: { selection: 'in-area', targetType: 'creature', area: { kind: 'sphere', size: 20 } }, effects: [] },
      ],
    };
    expect(findSpellTargetingWithArea(spell)?.area?.kind).toBe('sphere');
  });

  it('AoE + save + nested onFail matches grouped authoring', () => {
    const spell: Pick<SpellBase, 'effectGroups'> = {
      effectGroups: [
        {
          targeting: {
            selection: 'in-area',
            targetType: 'creature',
            area: { kind: 'square', size: 20 },
          },
          effects: [
            {
              kind: 'save',
              save: { ability: 'str' },
              onFail: [
                { kind: 'damage', damage: '3d6', damageType: 'bludgeoning' },
                { kind: 'condition', conditionId: 'restrained' },
              ],
            },
          ],
        },
      ],
    };
    expect(getPrimarySpellTargeting(spell)?.selection).toBe('in-area');
    const flat = flattenSpellEffects(spell);
    expect(flat[0]?.kind).toBe('save');
    if (flat[0]?.kind === 'save') {
      expect(flat[0].onFail?.map((e) => e.kind)).toEqual(['damage', 'condition']);
    }
  });
});
