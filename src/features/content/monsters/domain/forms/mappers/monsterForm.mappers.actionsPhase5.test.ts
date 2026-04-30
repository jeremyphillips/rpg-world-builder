/**
 * Phase 5 — mechanics.actions / bonusActions / legendaryActions split arrays.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';

import type { Monster } from '@/features/content/monsters/domain/types';

import {
  stripRowIdsDeep,
} from '@/features/content/shared/forms/assembly/mergePreserveExtras';

import {
  monsterToFormValues,
  tagMonsterForEditing,
  toMonsterInput,
} from './monsterForm.mappers';

function loadTagged(id: string): Monster {
  const m = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, id);
  if (!m) throw new Error(`${id} fixture missing`);
  return tagMonsterForEditing(m);
}

describe('monster actions Phase 5', () => {
  it('round-trips aboleth mechanics.actions, bonusActions, and legendary block', () => {
    const tagged = loadTagged('aboleth');
    const beforeActs = tagged.mechanics?.actions;
    const beforeBonus = tagged.mechanics?.bonusActions;
    const beforeLeg = tagged.mechanics?.legendaryActions;

    const form = monsterToFormValues(tagged);

    expect(form.specialActions.length).toBe(
      beforeActs?.filter((a) => a.kind === 'special').length ?? 0,
    );
    expect(form.naturalActions.length).toBe(beforeActs?.filter((a) => a.kind === 'natural').length ?? 0);
    expect(JSON.parse(form.legendaryActionsMeta)).toMatchObject({ uses: expect.any(Number) });
    expect(form.legendarySpecialActions).toHaveLength(0);

    const input = toMonsterInput(form, tagged);
    expect(input.mechanics?.actions).toEqual(stripRowIdsDeep(beforeActs));
    expect(input.mechanics?.bonusActions ?? []).toEqual(stripRowIdsDeep(beforeBonus ?? []));
    expect(input.mechanics?.legendaryActions).toEqual(stripRowIdsDeep(beforeLeg));
  });

  it('preserves a natural attack`s combat extras when editing the name label', () => {
    const tagged = loadTagged('aboleth');
    const form = monsterToFormValues(tagged);
    const tentacleIx = form.naturalActions.findIndex((r) => r.name === 'Tentacle');
    expect(tentacleIx).toBeGreaterThanOrEqual(0);
    const nextNaturals = form.naturalActions.map((r, i) =>
      i === tentacleIx ? { ...r, name: 'Tentacle (edited label)' } : r,
    );
    const edited = { ...form, naturalActions: nextNaturals };
    const input = toMonsterInput(edited, tagged);
    const tentacleOut = input.mechanics?.actions?.find(
      (a) => a.kind === 'natural' && a.id === 'tentacle',
    );
    expect(tentacleOut?.kind).toBe('natural');
    expect(tentacleOut).toMatchObject({
      name: 'Tentacle (edited label)',
      reach: 15,
      attackBonus: 9,
    });
  });

  it('round-trips an adult dragon with legendary inline specials across form', () => {
    const tagged = loadTagged('adult-brass-dragon');
    const beforeLeg = tagged.mechanics?.legendaryActions;
    expect(beforeLeg?.actions?.some((e) => e.kind === 'inline')).toBe(true);
    const form = monsterToFormValues(tagged);
    const input = toMonsterInput(form, tagged);
    expect(input.mechanics?.legendaryActions).toEqual(stripRowIdsDeep(beforeLeg));
  });
});
