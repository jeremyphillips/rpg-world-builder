/**
 * Structured description, languages, senses, equipment round-trips.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import type { Monster } from '@/features/content/monsters/domain/types';

import { stripRowIdsDeep } from '@/features/content/shared/forms/assembly/mergePreserveExtras';
import { monsterToFormValues, tagMonsterForEditing, toMonsterInput } from '../monsterForm.mappers';

function loadAboleth(): Monster {
  const m = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
  if (!m) throw new Error('aboleth fixture missing');
  return m;
}

describe('monster form (description, languages, senses, equipment)', () => {
  it('round-trips awakened shrub description, languages, and passive-only senses', () => {
    const raw = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'awakened-shrub');
    if (!raw) throw new Error('awakened-shrub fixture missing');
    const monster = tagMonsterForEditing(raw);
    const form = monsterToFormValues(monster);
    const input = toMonsterInput(form, monster);
    expect(input.description).toEqual(raw.description);
    expect(input.languages).toEqual(raw.languages);
    expect(input.mechanics?.senses).toEqual(raw.mechanics?.senses);
  });

  it('round-trips aboleth passive Perception and special senses', () => {
    const monster = tagMonsterForEditing(loadAboleth());
    const form = monsterToFormValues(monster);
    const input = toMonsterInput(form, monster);
    expect(input.mechanics?.senses).toEqual(stripRowIdsDeep(monster.mechanics?.senses));
  });

  it('round-trips assassin equipment records (weapon extras preserved)', () => {
    const raw = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'assassin');
    if (!raw?.mechanics?.equipment?.weapons) throw new Error('assassin fixture / equipment missing');
    const monster = tagMonsterForEditing(raw);
    const form = monsterToFormValues(monster);
    const input = toMonsterInput(form, monster);
    expect(input.mechanics?.equipment).toEqual(raw.mechanics?.equipment);
  });
});
