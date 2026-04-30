import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';
import type { Subclass } from '@/features/content/classes/domain/types/subclass.types';

import { classToFormValues, tagClassForEditing, toClassInput } from './classForm.mappers';

describe('class definitions.options merge (Phase 2)', () => {
  it('preserves nested subclass extras (e.g. spellcasting grants) when editing owned fields', () => {
    const cleric = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'cleric');
    expect(cleric).toBeTruthy();
    const tagged = tagClassForEditing(cleric!);
    const beforeOption = tagged.definitions!.options[0];
    expect(beforeOption?.features?.length).toBeGreaterThan(0);

    const form = classToFormValues(tagged);
    const lifeIdx = form.definitionsOptions.findIndex((r) => r.id === 'life_domain');
    expect(lifeIdx).toBeGreaterThanOrEqual(0);

    const nextOptions = [...form.definitionsOptions];
    nextOptions[lifeIdx] = {
      ...nextOptions[lifeIdx],
      description: 'Domain of life and vitality.',
    };

    const out = toClassInput({ ...form, definitionsOptions: nextOptions }, tagged);
    const life = out.definitions?.options?.find((o) => o.id === 'life_domain') as Subclass | undefined;

    expect(life?.description).toBe('Domain of life and vitality.');
    expect(life?.features).toEqual(beforeOption.features);
  });

  it('create-flow (no original) yields owned-keys-only subclass rows', () => {
    const form = classToFormValues(
      tagClassForEditing(getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'fighter')!),
    );
    const out = toClassInput(
      {
        ...form,
        definitionsId: 'pick',
        definitionsName: 'Pick one',
        definitionsOptions: [{ __rowId: '', id: 'a', name: 'A', description: 'aa' }],
      },
      undefined,
    );
    expect(out.definitions?.options?.[0]).toEqual({
      id: 'a',
      name: 'A',
      description: 'aa',
    });
  });
});
