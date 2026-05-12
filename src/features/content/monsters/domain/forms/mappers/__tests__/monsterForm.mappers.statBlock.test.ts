/**
 * Monster stat block composites (hit points, AC, movement, abilities).
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import type { Monster } from '@/features/content/monsters/domain/types';

import { monsterToFormValues, toMonsterInput } from '../monsterForm.mappers';

function loadAboleth(): Monster {
  const m = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
  if (!m) throw new Error('aboleth fixture missing');
  return m;
}

describe('monster stat block', () => {
  it('round-trips aboleth hit points, AC, movement, and abilities via form', () => {
    const monster = loadAboleth();
    const form = monsterToFormValues(monster);
    const input = toMonsterInput(form, monster);
    expect(input.mechanics?.hitPoints).toEqual(monster.mechanics?.hitPoints);
    expect(input.mechanics?.armorClass).toEqual(monster.mechanics?.armorClass);
    expect(input.mechanics?.movement).toEqual(monster.mechanics?.movement);
    expect(input.mechanics?.abilities).toEqual(monster.mechanics?.abilities);
  });

  it('preserves equipment armorRefs when AC kind stays equipment', () => {
    const skeleton = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'skeleton');
    if (!skeleton || skeleton.mechanics?.armorClass?.kind !== 'equipment') {
      throw new Error('skeleton fixture missing or not equipment AC');
    }
    const form = monsterToFormValues(skeleton);
    const input = toMonsterInput(form, skeleton);
    expect(input.mechanics?.armorClass).toEqual(skeleton.mechanics?.armorClass);
  });

  it('updates natural AC offset while keeping notes on the armor object', () => {
    const base = loadAboleth();
    const monster: Monster = {
      ...base,
      mechanics: {
        ...base.mechanics,
        armorClass: {
          kind: 'natural',
          offset: 5,
          notes: 'Spellbook tucked under carapace',
        },
      },
    };
    const form = monsterToFormValues(monster);
    const edited = {
      ...form,
      armorClassNaturalOffset: '9',
    };
    const input = toMonsterInput(edited, monster);
    expect(input.mechanics?.armorClass).toEqual({
      kind: 'natural',
      offset: 9,
      notes: 'Spellbook tucked under carapace',
    });
  });
});
