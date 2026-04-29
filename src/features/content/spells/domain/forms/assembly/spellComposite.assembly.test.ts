import { describe, expect, it } from 'vitest';
import type { SpellFormValues } from '../types/spellForm.types';
import { SPELL_FORM_DEFAULTS } from '../config/spellForm.config';
import {
  assembleSpellNestedFields,
  splitSpellNestedToForm,
} from './spellPayload.assembly';

const baseForm = (): SpellFormValues => ({ ...SPELL_FORM_DEFAULTS });

describe('spellComposite assembly', () => {
  it('round-trips description', () => {
    const v = baseForm();
    v.descriptionFull = 'Long text';
    v.descriptionSummary = 'Short';
    const nested = assembleSpellNestedFields(v);
    const back = splitSpellNestedToForm(nested);
    expect(back.descriptionFull).toBe('Long text');
    expect(back.descriptionSummary).toBe('Short');
  });

  it('round-trips casting time with reaction trigger', () => {
    const v = baseForm();
    v.castingTimeUnit = 'reaction';
    v.castingTimeTrigger = 'hit';
    v.castingTimeCanRitual = true;
    const nested = assembleSpellNestedFields(v);
    expect(nested.castingTime.normal.unit).toBe('reaction');
    expect(nested.castingTime.normal.trigger).toBe('hit');
    expect(nested.castingTime.canBeCastAsRitual).toBe(true);
    const back = splitSpellNestedToForm(nested);
    expect(back.castingTimeUnit).toBe('reaction');
    expect(back.castingTimeTrigger).toBe('hit');
  });

  it('round-trips range distance', () => {
    const v = baseForm();
    v.rangeKind = 'distance';
    v.rangeDistanceValue = '60';
    v.rangeDistanceUnit = 'ft';
    const nested = assembleSpellNestedFields(v);
    expect(nested.range).toEqual({ kind: 'distance', value: { value: 60, unit: 'ft' } });
    const back = splitSpellNestedToForm(nested);
    expect(back.rangeKind).toBe('distance');
    expect(back.rangeDistanceValue).toBe('60');
  });
});
