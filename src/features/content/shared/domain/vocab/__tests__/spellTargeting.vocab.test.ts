import { describe, expect, it } from 'vitest';

import {
  formatSpellEffectTargetingLabel,
  getTargetEligibilityById,
  getTargetSelectionById,
  TARGET_ELIGIBILITY_KINDS,
  TARGET_SELECTION_KINDS,
} from '../spellTargeting.vocab';

describe('spellTargeting.vocab', () => {
  it('exposes stable selection and eligibility ids', () => {
    expect(TARGET_SELECTION_KINDS).toContain('one');
    expect(TARGET_SELECTION_KINDS).toContain('in-area');
    expect(TARGET_ELIGIBILITY_KINDS).toContain('creature');
    expect(TARGET_ELIGIBILITY_KINDS).toContain('dead-creature');
    expect(TARGET_ELIGIBILITY_KINDS).toContain('object');
  });

  it('lookup helpers return definitions', () => {
    expect(getTargetSelectionById('chosen')?.name).toBe('Chosen');
    expect(getTargetEligibilityById('object')?.name).toBe('Object');
  });

  it('formatSpellEffectTargetingLabel covers single-target and AoE', () => {
    expect(
      formatSpellEffectTargetingLabel({ selection: 'one', targetType: 'creature' }),
    ).toBe('One creature');
    expect(
      formatSpellEffectTargetingLabel({ selection: 'one', targetType: 'dead-creature' }),
    ).toBe('One dead creature');
    expect(
      formatSpellEffectTargetingLabel({ selection: 'in-area', targetType: 'creature' }),
    ).toBe('Creatures in area');
    expect(
      formatSpellEffectTargetingLabel({ selection: 'chosen', targetType: 'creature' }),
    ).toBe('Chosen creatures');
  });
});
