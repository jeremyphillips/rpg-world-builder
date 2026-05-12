import { describe, expect, it } from 'vitest';

import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { getSystemClass } from '@/features/mechanics/domain/rulesets/system/classes';

import { classToFormValues, tagClassForEditing, toClassInput } from './classForm.mappers';

describe('class proficiencies & requirements (Phase 7)', () => {
  it('preserves multiclass RequirementExpr byte-for-byte on a no-edit round-trip', () => {
    const fighter = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'fighter');
    expect(fighter).toBeTruthy();
    const tagged = tagClassForEditing(fighter!);
    const mc = fighter!.requirements.multiclassing;
    expect(mc).toBeDefined();

    const form = classToFormValues(tagged);
    expect(form.requirementsMulticlassingJson.length).toBeGreaterThan(0);

    const out = toClassInput(form, tagged);
    expect(out.requirements.multiclassing).toEqual(mc);
  });

  it('preserves fighter allowed race restriction (human)', () => {
    const fighter = getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'fighter');
    expect(fighter!.requirements.allowedRaces).toEqual(['human']);
    const tagged = tagClassForEditing(fighter!);
    const form = classToFormValues(tagged);

    expect(form.requirementsAllowedRaceIds).toEqual(['human']);

    const out = toClassInput(form, tagged);
    expect(out.requirements.allowedRaces).toEqual(['human']);
  });

  it('writes weapon category edits back into domain', () => {
    const rogue = structuredClone(getSystemClass(DEFAULT_SYSTEM_RULESET_ID, 'rogue')!);
    const tagged = tagClassForEditing(rogue);

    const form = classToFormValues(tagged);
    const edited = {
      ...form,
      proficiencyWeaponsCategories: ['simple', 'martial'],
    };

    const out = toClassInput(edited, tagged);
    expect(out.proficiencies?.weapons?.categories?.sort()).toEqual(['martial', 'simple']);
  });
});
