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

const minimalFeyGoblinoid = {
  id: 'm1',
  name: 'Goblin',
  type: 'fey',
  subtype: 'goblinoid' as const,
  sizeCategory: 'small',
} as unknown as Monster;

describe('monsterForm.mappers', () => {
  it('round-trips subtype for fey with goblinoid', () => {
    const form = monsterToFormValues(minimalFeyGoblinoid);
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
  it('exposes goblinoid for fey and fiend options from taxonomy (not duplicated labels)', () => {
    const fey = getMonsterFieldConfigs({ selectedCreatureType: 'fey' });
    const subFey = fey.find((c) => c.name === 'subtype' && c.type === 'select');
    expect(subFey).toBeDefined();
    if (subFey && subFey.type === 'select') {
      expect(subFey.options).toEqual(getAllowedSubtypeOptionsForCreatureType('fey'));
      expect(subFey.options.some((o) => o.value === 'goblinoid')).toBe(true);
    }
    const humanoid = getMonsterFieldConfigs({ selectedCreatureType: 'humanoid' });
    const subHumanoid = humanoid.find((c) => c.name === 'subtype' && c.type === 'select');
    expect(subHumanoid).toBeDefined();
    if (subHumanoid && subHumanoid.type === 'select') {
      expect(subHumanoid.options).toEqual(getAllowedSubtypeOptionsForCreatureType('humanoid'));
      expect(subHumanoid.options.some((o) => o.value === 'goblinoid')).toBe(false);
    }
    const fiend = getMonsterFieldConfigs({ selectedCreatureType: 'fiend' });
    const subFiend = fiend.find((c) => c.name === 'subtype' && c.type === 'select');
    expect(subFiend).toBeDefined();
    if (subFiend && subFiend.type === 'select') {
      expect(subFiend.options).toEqual(getAllowedSubtypeOptionsForCreatureType('fiend'));
    }
  });
});
