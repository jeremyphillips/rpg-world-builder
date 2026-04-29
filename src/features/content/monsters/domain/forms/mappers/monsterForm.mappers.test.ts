import { describe, expect, it } from 'vitest';
import {
  getMonsterFieldConfigs,
  monsterToFormValues,
  toMonsterInput,
  MONSTER_FORM_DEFAULTS,
  type MonsterFormValues,
} from '@/features/content/monsters/domain';
import type { Monster } from '@/features/content/monsters/domain/types';
import { getAllowedSubtypeOptionsForCreatureType } from '@/features/content/creatures/domain/options/creatureTaxonomyOptions';

const minimalMonster = {
  id: 'm1',
  name: 'Goblin',
  type: 'humanoid',
  subtype: 'goblinoid' as const,
  sizeCategory: 'small',
} as unknown as Monster;

describe('monsterForm.mappers', () => {
  it('round-trips subtype for a humanoid with goblinoid', () => {
    const form = monsterToFormValues(minimalMonster);
    expect(form.subtype).toBe('goblinoid');
    const input = toMonsterInput({ ...form, name: 'Goblin' });
    expect(input.subtype).toBe('goblinoid');
  });

  it('drops subtype in toMonsterInput when it does not match the type', () => {
    const form: MonsterFormValues = {
      ...MONSTER_FORM_DEFAULTS,
      name: 'X',
      type: 'dragon',
      subtype: 'goblinoid',
      sizeCategory: 'medium',
    };
    const input = toMonsterInput(form);
    expect(input.subtype).toBeUndefined();
  });
});

describe('getMonsterFieldConfigs (subtype options)', () => {
  it('exposes goblinoid for humanoid and fiend options from taxonomy (not duplicated labels)', () => {
    const humanoid = getMonsterFieldConfigs({ selectedCreatureType: 'humanoid' });
    const subField = humanoid.find((c) => c.name === 'subtype' && c.type === 'select');
    expect(subField).toBeDefined();
    if (subField && subField.type === 'select') {
      expect(subField.options).toEqual(getAllowedSubtypeOptionsForCreatureType('humanoid'));
      expect(subField.options.some((o) => o.value === 'goblinoid')).toBe(true);
    }
    const fiend = getMonsterFieldConfigs({ selectedCreatureType: 'fiend' });
    const subFiend = fiend.find((c) => c.name === 'subtype' && c.type === 'select');
    expect(subFiend).toBeDefined();
    if (subFiend && subFiend.type === 'select') {
      expect(subFiend.options).toEqual(getAllowedSubtypeOptionsForCreatureType('fiend'));
    }
  });
});
