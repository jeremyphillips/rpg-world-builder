import { describe, expect, it } from 'vitest';

import {
  AUTHORABLE_EFFECT_KIND_IDS,
  EFFECT_KIND_DEFINITIONS,
  EFFECT_KIND_IDS,
  USER_FACING_EFFECT_KIND_IDS,
  effectKindsInCategory,
  getAuthorableEffectKindSelectOptions,
  getEffectKindById,
  getEffectKindName,
} from '../effectKinds.vocab';

describe('effectKinds.vocab', () => {
  it('has one row per id and no duplicate ids', () => {
    const ids = EFFECT_KIND_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(EFFECT_KIND_DEFINITIONS.length);
    expect(ids.length).toBe(EFFECT_KIND_IDS.length);
  });

  it('lookup helpers return stable names', () => {
    expect(getEffectKindById('damage')?.name).toBe('Damage');
    expect(getEffectKindName('save')).toBe('Save');
  });

  it('filters by category', () => {
    const core = effectKindsInCategory('core');
    expect(core.every((d) => d.category === 'core')).toBe(true);
    expect(core.some((d) => d.id === 'damage')).toBe(true);
  });

  it('authorable and user-facing lists are subsets of all ids', () => {
    const all = new Set(EFFECT_KIND_IDS);
    for (const id of AUTHORABLE_EFFECT_KIND_IDS) {
      expect(all.has(id)).toBe(true);
    }
    for (const id of USER_FACING_EFFECT_KIND_IDS) {
      expect(all.has(id)).toBe(true);
    }
  });

  it('narrows authorable kinds for spell UI and select options match registry', () => {
    expect(AUTHORABLE_EFFECT_KIND_IDS.length).toBe(11);
    expect(new Set(AUTHORABLE_EFFECT_KIND_IDS).size).toBe(11);
    const opts = getAuthorableEffectKindSelectOptions();
    expect(opts.length).toBe(11);
    for (const o of opts) {
      expect(AUTHORABLE_EFFECT_KIND_IDS).toContain(o.value);
    }
    const sortedNames = [...opts].sort((a, b) => a.label.localeCompare(b.label));
    expect(opts).toEqual(sortedNames);
  });

  it('marks targeting as internal and non-authorable', () => {
    const t = getEffectKindById('targeting');
    expect(t?.category).toBe('internal');
    expect(t?.authorable).toBe(false);
  });
});
