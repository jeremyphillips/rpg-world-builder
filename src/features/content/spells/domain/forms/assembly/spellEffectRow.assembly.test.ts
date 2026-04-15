import { describe, expect, it } from 'vitest';

import type { SpellEffect, SpellEffectGroup } from '@/features/content/spells/domain/types';
import {
  assembleDiceDamageString,
  createDefaultSpellEffectFormRow,
  formRowToSpellEffect,
  spellEffectGroupsDomainToForm,
  spellEffectGroupsFormToDomain,
  spellEffectToFormRow,
} from './spellEffectRow.assembly';

describe('spellEffectRow assembly', () => {
  const base = () => createDefaultSpellEffectFormRow();

  it('maps note rows', () => {
    const eff = formRowToSpellEffect({ ...base(), kind: 'note', noteText: ' Flavor ' });
    expect(eff).toEqual({ kind: 'note', text: 'Flavor' });
  });

  it('defaults new rows to damage format dice', () => {
    expect(createDefaultSpellEffectFormRow().damageFormat).toBe('dice');
  });

  it('assembles dice mode damage including modifier', () => {
    expect(
      assembleDiceDamageString({
        damageDiceCount: '3',
        damageDieFace: '6',
        damageModifier: '2',
      }),
    ).toBe('3d6+2');
  });

  it('maps damage rows in dice mode', () => {
    const eff = formRowToSpellEffect({
      ...base(),
      kind: 'damage',
      damageFormat: 'dice',
      damageDiceCount: '1',
      damageDieFace: '8',
      damageModifier: '3',
      damageFlatValue: '',
      damageType: 'necrotic',
    });
    expect(eff).toMatchObject({ kind: 'damage', damage: '1d8+3', damageType: 'necrotic' });
  });

  it('maps damage rows in flat mode', () => {
    const eff = formRowToSpellEffect({
      ...base(),
      kind: 'damage',
      damageFormat: 'flat',
      damageFlatValue: '8',
      damageType: '',
    });
    expect(eff).toEqual({ kind: 'damage', damage: 8 });
  });

  it('maps condition rows', () => {
    const eff = formRowToSpellEffect({
      ...base(),
      kind: 'condition',
      conditionId: 'grappled',
    });
    expect(eff).toEqual({ kind: 'condition', conditionId: 'grappled' });
  });

  it('maps move rows', () => {
    const eff = formRowToSpellEffect({
      ...base(),
      kind: 'move',
      moveDistance: '30',
      moveForced: true,
    });
    expect(eff).toEqual({ kind: 'move', distance: 30, forced: true });
  });

  it('maps resource rows', () => {
    const eff = formRowToSpellEffect({
      ...base(),
      kind: 'resource',
      resourceId: 'test-resource',
      resourceMax: '3',
      resourceRecharge: 'long-rest',
    });
    expect(eff).toEqual({
      kind: 'resource',
      resource: { id: 'test-resource', max: 3, recharge: 'long-rest' },
    });
  });

  it('stub kind rows produce no domain effect', () => {
    expect(formRowToSpellEffect({ ...base(), kind: 'save' })).toBeNull();
  });

  it('spellEffectToFormRow round-trips supported kinds', () => {
    const samples: SpellEffectGroup[] = [
      {
        targeting: { selection: 'one', targetType: 'creature' },
        effects: [
          { kind: 'note', text: 'Hi' },
          { kind: 'damage', damage: 4 },
        ],
      },
    ];
    const form = spellEffectGroupsDomainToForm(samples);
    const back = spellEffectGroupsFormToDomain(form);
    expect(back).toEqual([
      {
        targeting: { selection: 'one', targetType: 'creature' },
        effects: [
          { kind: 'note', text: 'Hi' },
          { kind: 'damage', damage: 4 },
        ],
      },
    ]);
  });

  it('spellEffectToFormRow preserves phase-1 stub kinds as form rows', () => {
    const row = spellEffectToFormRow({ kind: 'grant', grantType: 'proficiency', value: [] } as SpellEffect);
    expect(row.kind).toBe('grant');
  });
});
