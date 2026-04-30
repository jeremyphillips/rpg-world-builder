import { describe, expect, it } from 'vitest';
import type { FormLayoutNode } from '@/ui/patterns';
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
  /**
   * `getMonsterFieldConfigs` now returns `FormLayoutNode[]` (Phase 1 swap to
   * `buildFormLayout`). The union includes nodes that lack a top-level `name`
   * (custom nodes) so we narrow before accessing field-specific keys.
   */
  const findSubtypeSelect = (nodes: FormLayoutNode[]) =>
    nodes.find(
      (c): c is FormLayoutNode & { name: 'subtype'; type: 'select' } =>
        'name' in c && c.name === 'subtype' && 'type' in c && c.type === 'select',
    );

  it('exposes goblinoid for fey and fiend options from taxonomy (not duplicated labels)', () => {
    const fey = getMonsterFieldConfigs({ selectedCreatureType: 'fey' });
    const subFey = findSubtypeSelect(fey);
    expect(subFey).toBeDefined();
    if (subFey) {
      expect(subFey.options).toEqual(getAllowedSubtypeOptionsForCreatureType('fey'));
      expect(subFey.options.some((o) => o.value === 'goblinoid')).toBe(true);
    }
    const humanoid = getMonsterFieldConfigs({ selectedCreatureType: 'humanoid' });
    const subHumanoid = findSubtypeSelect(humanoid);
    expect(subHumanoid).toBeDefined();
    if (subHumanoid) {
      expect(subHumanoid.options).toEqual(getAllowedSubtypeOptionsForCreatureType('humanoid'));
      expect(subHumanoid.options.some((o) => o.value === 'goblinoid')).toBe(false);
    }
    const fiend = getMonsterFieldConfigs({ selectedCreatureType: 'fiend' });
    const subFiend = findSubtypeSelect(fiend);
    expect(subFiend).toBeDefined();
    if (subFiend) {
      expect(subFiend.options).toEqual(getAllowedSubtypeOptionsForCreatureType('fiend'));
    }
  });
});
