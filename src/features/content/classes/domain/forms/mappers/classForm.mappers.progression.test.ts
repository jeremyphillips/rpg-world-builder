import { describe, expect, it } from 'vitest';

import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { ClassFeature } from '@/features/content/classes/domain/types/progression.types';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';

import { classToFormValues, tagClassForEditing, toClassInput } from './classForm.mappers';

function cloneCharacterClass(cl: CharacterClass): CharacterClass {
  return structuredClone(cl);
}

describe('class progression (Phase 3)', () => {
  it('preserves nested spell progression when editing hit die scalar', () => {
    const warlock = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'warlock');
    expect(warlock).toBeTruthy();
    const tagged = tagClassForEditing(warlock!);
    expect(tagged.progression?.spellProgression?.mysticArcanum?.length).toBeGreaterThan(0);
    const form = classToFormValues(tagged);
    const out = toClassInput({ ...form, progressionHitDie: '10' }, tagged);
    expect(out.progression?.hitDie).toBe(10);
    expect(out.progression?.spellProgression?.mysticArcanum).toEqual(
      tagged.progression!.spellProgression!.mysticArcanum
    );
  });

  it('preserves MVP extras on progression.features rows (e.g. effects) while editing authored fields', () => {
    const ranger = cloneCharacterClass(getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'ranger')!);
    const feats = ranger.progression.features!.map((f) =>
      f.id === 'weapon_mastery'
        ? {
            ...f,
            effects: [{ preservedForTest: true }] as unknown as NonNullable<ClassFeature['effects']>,
          }
        : f
    );

    ranger.progression = { ...ranger.progression, features: feats };

    const tagged = tagClassForEditing(ranger);
    const form = classToFormValues(tagged);

    const wepIdx = form.progressionFeatures.findIndex((row) => row.id === 'weapon_mastery');
    expect(wepIdx).toBeGreaterThanOrEqual(0);

    const nextFx = [...form.progressionFeatures];
    nextFx[wepIdx] = { ...nextFx[wepIdx], description: 'Test note for weapon mastery.' };

    const out = toClassInput({ ...form, progressionFeatures: nextFx }, tagged);
    const wep = out.progression!.features!.find((f) => f.id === 'weapon_mastery') as ClassFeature & {
      effects?: unknown;
    };

    expect(wep?.description).toBe('Test note for weapon mastery.');
    expect(wep?.effects).toEqual([{ preservedForTest: true }]);
  });
});
