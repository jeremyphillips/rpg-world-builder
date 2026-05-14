import { describe, expect, it } from 'vitest';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Weapon } from '@/features/content/equipment/weapons/domain/types';
import { buildDefaultFormValues } from '@/features/content/shared/forms/registry';
import { WEAPON_FORM_FIELDS } from '../registry/weaponForm.registry';
import type { WeaponFormValues } from '../types/weaponForm.types';
import { toWeaponInput, weaponToFormValues } from './weaponForm.mappers';

const baseForm = () =>
  buildDefaultFormValues(WEAPON_FORM_FIELDS) as WeaponFormValues;

describe('weaponForm.mappers', () => {
  it('round-trips default damage 1d8', () => {
    const weapon = {
      id: 'w1',
      name: 'Test',
      source: 'campaign' as const,
      cost: { amount: 0, unit: 'cp' as const },
      category: 'simple' as const,
      mode: 'melee' as const,
      properties: [],
      damage: { default: '1d8' },
      damageType: 'slashing',
    } as unknown as Weapon;

    const form = weaponToFormValues(weapon);
    expect(form.damageDefaultCount).toBe('1');
    expect(form.damageDefaultDie).toBe('8');

    const input = toWeaponInput({
      ...baseForm(),
      name: 'Test',
      category: 'simple',
      mode: 'melee',
      damageDefaultCount: form.damageDefaultCount,
      damageDefaultDie: form.damageDefaultDie,
      damageVersatileCount: '0',
      damageVersatileDie: '8',
      damageType: 'slashing',
      properties: [],
    });
    expect(input.damage?.default).toBe('1d8');
    expect(input.damage?.versatile).toBeUndefined();
  });

  it('round-trips versatile damage 1d10 with versatile property', () => {
    const weapon = {
      id: 'w2',
      name: 'Longsword',
      source: 'campaign' as const,
      cost: { amount: 0, unit: 'cp' as const },
      category: 'martial' as const,
      mode: 'melee' as const,
      properties: ['versatile' as const],
      damage: { default: '1d8', versatile: '1d10' },
      damageType: 'slashing',
    } as unknown as Weapon;

    const form = weaponToFormValues(weapon);
    expect(form.damageVersatileCount).toBe('1');
    expect(form.damageVersatileDie).toBe('10');

    const input = toWeaponInput({
      ...baseForm(),
      name: 'Longsword',
      category: 'martial',
      mode: 'melee',
      damageDefaultCount: '1',
      damageDefaultDie: '8',
      damageVersatileCount: '1',
      damageVersatileDie: '10',
      damageType: 'slashing',
      properties: ['versatile'],
    });
    expect(input.damage?.versatile).toBe('1d10');
  });

  it('omits damage.versatile when versatile count is 0', () => {
    const input = toWeaponInput({
      ...baseForm(),
      name: 'Rapier',
      category: 'martial',
      mode: 'melee',
      damageDefaultCount: '1',
      damageDefaultDie: '8',
      damageVersatileCount: '0',
      damageVersatileDie: '10',
      damageType: 'piercing',
      properties: ['versatile'],
    });
    expect(input.damage?.versatile).toBeUndefined();
  });

  it('does not set versatile when count is 0 even if die is non-default', () => {
    const input = toWeaponInput({
      ...baseForm(),
      name: 'X',
      category: 'simple',
      mode: 'melee',
      damageDefaultCount: '1',
      damageDefaultDie: '6',
      damageVersatileCount: '0',
      damageVersatileDie: '12',
      damageType: 'bludgeoning',
      properties: ['versatile'],
    });
    expect(input.damage?.versatile).toBeUndefined();
  });

  it('uses die face 8 as fallback for invalid versatile die string (aligned with form default)', () => {
    const input = toWeaponInput({
      ...baseForm(),
      name: 'Y',
      category: 'martial',
      mode: 'melee',
      damageDefaultCount: '1',
      damageDefaultDie: '8',
      damageVersatileCount: '2',
      damageVersatileDie: 'not-a-face',
      damageType: 'slashing',
      properties: ['versatile'],
    });
    expect(input.damage?.versatile).toBe('2d8');
  });
});
