/**
 * Phase 6 structured groups: senses specials, languages, equipment (weapons + armor).
 */
import type { CreatureSense } from '@/features/content/shared/domain/vocab/creatureSenses.types';
import { CREATURE_SENSE_TYPE_DEFINITIONS } from '@/features/content/shared/domain/vocab/creatureSenses.vocab';
import type { Monster } from '@/features/content/monsters/domain/types';
import type { MonsterInput } from '@/features/content/monsters/domain/types';
import type {
  MonsterEquippedArmor,
  MonsterEquippedWeapon,
} from '@/features/content/monsters/domain/types/monster-equipment.types';
import { tagRowsWithIds } from '@/features/content/shared/forms/assembly/mergePreserveExtras';
import type { RepeatableGroupSpec } from '@/features/content/shared/forms/registry/formNodeSpec.types';
import type { MonsterEquipmentArmorFormRow, MonsterEquipmentWeaponFormRow } from './monsterForm.phase6.assembly';
import {
  armorFormRowsToDomainRecord,
  languagesSerialize,
  senseSpecialSerialize,
  weaponFormRowsToDomainRecord,
} from './monsterForm.phase6.assembly';
import type { MonsterFormValues } from '../types/monsterForm.types';

function equipmentWeaponsPatchSerialize(
  uiValue: unknown,
  currentDomainValue: unknown,
): Record<string, MonsterEquippedWeapon & { __rowId?: string }> {
  const formRows = Array.isArray(uiValue) ? (uiValue as MonsterEquipmentWeaponFormRow[]) : [];
  const rec =
    currentDomainValue != null && typeof currentDomainValue === 'object' && !Array.isArray(currentDomainValue)
      ? (currentDomainValue as Record<string, MonsterEquippedWeapon & { __rowId?: string }>)
      : undefined;
  const built = weaponFormRowsToDomainRecord(formRows, rec);
  return built ?? {};
}

function equipmentArmorPatchSerialize(
  uiValue: unknown,
  currentDomainValue: unknown,
): Record<string, MonsterEquippedArmor & { __rowId?: string }> {
  const formRows = Array.isArray(uiValue) ? (uiValue as MonsterEquipmentArmorFormRow[]) : [];
  const rec =
    currentDomainValue != null && typeof currentDomainValue === 'object' && !Array.isArray(currentDomainValue)
      ? (currentDomainValue as Record<string, MonsterEquippedArmor & { __rowId?: string }>)
      : undefined;
  const built = armorFormRowsToDomainRecord(formRows, rec);
  return built ?? {};
}

export const MONSTER_SENSE_TYPE_OPTIONS = CREATURE_SENSE_TYPE_DEFINITIONS.map((d) => ({
  value: d.id,
  label: d.name,
}));

export const monsterSenseSpecialGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'senseSpecialRows',
  label: 'Special senses',
  itemLabel: 'Sense',
  defaultItem: {
    __rowId: '',
    type: 'darkvision',
    range: '',
  },
  children: [
    {
      name: '__rowId',
      label: '',
      kind: 'text',
      skipInForm: true,
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'type',
      label: 'Type',
      kind: 'select',
      required: true,
      options: MONSTER_SENSE_TYPE_OPTIONS,
      placeholder: 'Sense type',
      defaultValue: 'darkvision' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'range',
      label: 'Range (ft.)',
      kind: 'numberText',
      placeholder: '—',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
  ],
  patchBinding: {
    domainPath: 'mechanics.senses.special',
    parse: (domainValue: unknown) => {
      if (!Array.isArray(domainValue)) return [];
      return tagRowsWithIds(domainValue as readonly CreatureSense[]);
    },
    serialize: (uiValue: unknown, currentDomainValue: unknown) =>
      senseSpecialSerialize(uiValue, currentDomainValue),
  },
};

export const monsterLanguagesGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'languageRows',
  label: 'Languages',
  itemLabel: 'Language',
  defaultItem: {
    __rowId: '',
    id: '',
    speaks: false,
  },
  children: [
    {
      name: '__rowId',
      label: '',
      kind: 'text',
      skipInForm: true,
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'id',
      label: 'Language id',
      kind: 'text',
      required: true,
      placeholder: 'e.g. common',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'speaks',
      label: 'Speaks',
      kind: 'checkbox',
      defaultValue: false as MonsterFormValues[keyof MonsterFormValues],
    },
  ],
  patchBinding: {
    domainPath: 'languages',
    parse: (domainValue: unknown) => {
      if (!Array.isArray(domainValue)) return [];
      return tagRowsWithIds(domainValue as readonly Record<string, unknown>[]);
    },
    serialize: languagesSerialize,
  },
};

export const monsterEquipmentWeaponsGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'equipmentWeaponRows',
  label: 'Equipment — weapons',
  itemLabel: 'Weapon slot',
  defaultItem: {
    __rowId: '',
    ref: '',
    weaponId: '',
    aliasName: '',
    attackBonus: '',
    damageBonus: '',
    reach: '',
    notes: '',
  },
  children: [
    {
      name: '__rowId',
      label: '',
      kind: 'text',
      skipInForm: true,
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'ref',
      label: 'Action ref key',
      kind: 'text',
      required: true,
      placeholder: 'e.g. shortsword (matches weapon action weaponRef)',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
      helperText: 'Stable key referenced by weapon actions (`weaponRef`).',
    },
    {
      name: 'weaponId',
      label: 'Weapon id',
      kind: 'text',
      required: true,
      placeholder: 'Catalog id',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'aliasName',
      label: 'Display name',
      kind: 'text',
      placeholder: 'Optional',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'attackBonus',
      label: 'Attack bonus',
      kind: 'numberText',
      placeholder: '—',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'damageBonus',
      label: 'Damage bonus',
      kind: 'numberText',
      placeholder: '—',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'reach',
      label: 'Reach (ft.)',
      kind: 'numberText',
      placeholder: '—',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'notes',
      label: 'Notes',
      kind: 'textarea',
      placeholder: 'Extra damage / riders',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
      minRows: 2,
      maxRows: 6,
    },
  ],
  patchBinding: {
    domainPath: 'mechanics.equipment.weapons',
    parse: (domainValue: unknown) => {
      const rec =
        domainValue != null && typeof domainValue === 'object' && !Array.isArray(domainValue)
          ? (domainValue as Record<string, MonsterEquippedWeapon & { __rowId?: string }>)
          : undefined;
      if (!rec) return [];
      const rows = Object.entries(rec).map(([ref, w]) => ({ ref, ...w }));
      return tagRowsWithIds(rows as readonly Record<string, unknown>[]);
    },
    serialize: equipmentWeaponsPatchSerialize,
  },
};

export const monsterEquipmentArmorGroup: RepeatableGroupSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> = {
  kind: 'repeatable-group',
  name: 'equipmentArmorRows',
  label: 'Equipment — armor',
  itemLabel: 'Armor slot',
  defaultItem: {
    __rowId: '',
    ref: '',
    armorId: '',
    aliasName: '',
    notes: '',
    acModifier: '',
  },
  children: [
    {
      name: '__rowId',
      label: '',
      kind: 'text',
      skipInForm: true,
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'ref',
      label: 'Slot key',
      kind: 'text',
      required: true,
      placeholder: 'e.g. studded-leather',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
      helperText: 'Key used in armor class `armorRefs` when applicable.',
    },
    {
      name: 'armorId',
      label: 'Armor id',
      kind: 'text',
      required: true,
      placeholder: 'Catalog id',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'aliasName',
      label: 'Display name',
      kind: 'text',
      placeholder: 'Optional',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'acModifier',
      label: 'AC modifier',
      kind: 'numberText',
      placeholder: '—',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
    },
    {
      name: 'notes',
      label: 'Notes',
      kind: 'textarea',
      placeholder: 'Optional',
      defaultValue: '' as MonsterFormValues[keyof MonsterFormValues],
      minRows: 2,
      maxRows: 4,
    },
  ],
  patchBinding: {
    domainPath: 'mechanics.equipment.armor',
    parse: (domainValue: unknown) => {
      const rec =
        domainValue != null && typeof domainValue === 'object' && !Array.isArray(domainValue)
          ? (domainValue as Record<string, MonsterEquippedArmor & { __rowId?: string }>)
          : undefined;
      if (!rec) return [];
      const rows = Object.entries(rec).map(([ref, a]) => ({ ref, ...a }));
      return tagRowsWithIds(rows as readonly Record<string, unknown>[]);
    },
    serialize: equipmentArmorPatchSerialize,
  },
};
