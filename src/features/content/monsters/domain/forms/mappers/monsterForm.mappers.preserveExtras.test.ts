/**
 * Phase 1 (monster traits) preserve-extras tests.
 *
 * Verifies that the structured `traits` group round-trips domain extras
 * (`resolution.caveats`, hypothetical `effects`/`uses`/`trigger`) through the
 * load → edit → save flow, including reorder/insert/delete cases.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemMonster } from '@/features/mechanics/domain/rulesets/system/monsters';
import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterTrait } from '@/features/content/monsters/domain/types/monster-traits.types';

import {
  monsterToFormValues,
  tagMonsterForEditing,
  toMonsterInput,
  MONSTER_FORM_DEFAULTS,
} from '@/features/content/monsters/domain';

function loadAbolethTagged(): Monster {
  const aboleth = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
  if (!aboleth) {
    throw new Error('aboleth fixture missing from system catalog');
  }
  return tagMonsterForEditing(aboleth);
}

describe('monster traits — preserve extras', () => {
  it('tagMonsterForEditing attaches a unique __rowId to each trait', () => {
    const aboleth = getSystemMonster(DEFAULT_SYSTEM_RULESET_ID, 'aboleth');
    expect(aboleth).toBeDefined();
    const tagged = tagMonsterForEditing(aboleth!);
    const traits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    expect(traits.length).toBeGreaterThan(0);
    const ids = traits.map((t) => t.__rowId);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('monsterToFormValues propagates __rowId from a tagged source onto form rows', () => {
    const tagged = loadAbolethTagged();
    const sourceTraits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    const form = monsterToFormValues(tagged);
    expect(form.traits).toHaveLength(sourceTraits.length);
    for (let i = 0; i < sourceTraits.length; i++) {
      expect(form.traits[i].__rowId).toBe(sourceTraits[i].__rowId);
      expect(form.traits[i].name).toBe(sourceTraits[i].name);
    }
  });

  it('editing a trait description preserves siblings byte-for-byte and that trait\'s extras', () => {
    const tagged = loadAbolethTagged();
    const sourceTraits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    const form = monsterToFormValues(tagged);

    const mucusIndex = form.traits.findIndex((t) => t.name === 'Mucus Cloud');
    expect(mucusIndex).toBeGreaterThanOrEqual(0);

    const editedTraits = form.traits.map((t, i) =>
      i === mucusIndex ? { ...t, description: 'EDITED for round-trip' } : t,
    );
    const edited = { ...form, traits: editedTraits };

    const input = toMonsterInput(edited, tagged);
    const outTraits = (input.mechanics?.traits ?? []) as MonsterTrait[];
    expect(outTraits).toHaveLength(sourceTraits.length);

    for (let i = 0; i < sourceTraits.length; i++) {
      const src = sourceTraits[i];
      const out = outTraits[i];
      const { __rowId: _omitId, ...srcWithoutId } = src as MonsterTrait & { __rowId?: string };
      void _omitId;
      if (i === mucusIndex) {
        expect(out.name).toBe(src.name);
        expect(out.description).toBe('EDITED for round-trip');
        expect(out.resolution).toEqual(src.resolution);
      } else {
        expect(out).toEqual(srcWithoutId);
      }
      expect(out).not.toHaveProperty('__rowId');
    }
  });

  it('reordering traits in the form preserves each row\'s extras', () => {
    const tagged = loadAbolethTagged();
    const sourceTraits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    expect(sourceTraits.length).toBeGreaterThanOrEqual(2);
    const form = monsterToFormValues(tagged);

    const reordered = [...form.traits].reverse();
    const edited = { ...form, traits: reordered };

    const input = toMonsterInput(edited, tagged);
    const outTraits = (input.mechanics?.traits ?? []) as MonsterTrait[];
    expect(outTraits).toHaveLength(sourceTraits.length);

    const reverseSources = [...sourceTraits].reverse();
    for (let i = 0; i < reverseSources.length; i++) {
      const src = reverseSources[i];
      const { __rowId: _omitId, ...srcWithoutId } = src as MonsterTrait & { __rowId?: string };
      void _omitId;
      expect(outTraits[i]).toEqual(srcWithoutId);
    }
  });

  it('inserting a brand-new trait keeps existing rows\' extras intact', () => {
    const tagged = loadAbolethTagged();
    const sourceTraits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    const form = monsterToFormValues(tagged);

    const inserted = [
      ...form.traits,
      { __rowId: '', name: 'Brand New Trait', description: 'fresh row' },
    ];
    const edited = { ...form, traits: inserted };

    const input = toMonsterInput(edited, tagged);
    const outTraits = (input.mechanics?.traits ?? []) as MonsterTrait[];
    expect(outTraits).toHaveLength(sourceTraits.length + 1);

    for (let i = 0; i < sourceTraits.length; i++) {
      const src = sourceTraits[i];
      const { __rowId: _omitId, ...srcWithoutId } = src as MonsterTrait & { __rowId?: string };
      void _omitId;
      expect(outTraits[i]).toEqual(srcWithoutId);
    }
    const last = outTraits[outTraits.length - 1];
    expect(last).toEqual({ name: 'Brand New Trait', description: 'fresh row' });
    expect(last).not.toHaveProperty('__rowId');
  });

  it('deleting a trait removes only that row and preserves the rest', () => {
    const tagged = loadAbolethTagged();
    const sourceTraits = (tagged.mechanics?.traits ?? []) as Array<
      MonsterTrait & { __rowId?: string }
    >;
    const form = monsterToFormValues(tagged);

    const mucusIndex = form.traits.findIndex((t) => t.name === 'Mucus Cloud');
    expect(mucusIndex).toBeGreaterThanOrEqual(0);

    const without = form.traits.filter((_, i) => i !== mucusIndex);
    const edited = { ...form, traits: without };

    const input = toMonsterInput(edited, tagged);
    const outTraits = (input.mechanics?.traits ?? []) as MonsterTrait[];
    expect(outTraits).toHaveLength(sourceTraits.length - 1);
    expect(outTraits.find((t) => t.name === 'Mucus Cloud')).toBeUndefined();

    const expectedSurvivors = sourceTraits.filter((_, i) => i !== mucusIndex);
    for (let i = 0; i < expectedSurvivors.length; i++) {
      const src = expectedSurvivors[i];
      const { __rowId: _omitId, ...srcWithoutId } = src as MonsterTrait & { __rowId?: string };
      void _omitId;
      expect(outTraits[i]).toEqual(srcWithoutId);
    }
  });

  it('toMonsterInput called without `original` (create flow) yields owned-keys-only rows', () => {
    const newForm = {
      __rowId: '',
      name: 'Solo trait',
      description: 'no source to merge with',
    };
    const stub = {
      ...MONSTER_FORM_DEFAULTS,
      name: 'New Monster',
      traits: [newForm],
    };

    const input = toMonsterInput(stub as never);
    const outTraits = (input.mechanics?.traits ?? []) as MonsterTrait[];
    expect(outTraits).toEqual([{ name: 'Solo trait', description: 'no source to merge with' }]);
  });
});
