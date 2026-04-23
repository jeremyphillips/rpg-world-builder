/**
 * Monster form field registry.
 * Standard fields (name, type, sizeCategory) + individual JSON fields for each mechanics/lore subfield.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { numberRange, type FieldSpec } from '@/features/content/shared/forms/registry';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import type { MonsterFormValues } from '../types/monsterForm.types';
import { getAlignmentFormSelectOptions } from '@/features/content/shared/domain/vocab/alignment.vocab';
import type { AlignmentId } from '@/features/content/shared/domain/types';
import {
  PROFICIENCY_BONUS_MAX,
  PROFICIENCY_BONUS_MIN,
  isProficiencyBonus,
} from '@/shared/domain/proficiency';
import {
  CREATURE_IMMUNITY_PICKER_OPTIONS,
  CREATURE_VULNERABILITY_PICKER_OPTIONS,
} from '@/features/content/shared/domain/vocab/creatureImmunitiesForm.vocab';
import { MONSTER_TYPE_OPTIONS, MONSTER_SIZE_CATEGORY_OPTIONS } from '@/features/content/monsters/domain/vocab/monster.vocab';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const trimOrNull = (v: unknown): string | null => (trim(v) ? trim(v) : null);
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

const parseJson = (v: unknown): unknown => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') return typeof v === 'object' && v !== null ? v : undefined;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

const formatJson = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '';
    }
  }
  return '';
};

type MonsterPatchPathPrefix = 'mechanics' | 'lore';

/** JSON subfields. `patchPathPrefix` sets `path` for system patch mode (`mechanics.*` / `lore.*`); RHF still uses flat names via mapper. */
const jsonField = <K extends keyof MonsterFormValues>(
  name: K,
  label: string,
  placeholder: string,
  minRows = 2,
  maxRows = 8,
  patchPathPrefix?: MonsterPatchPathPrefix
): FieldSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>> => ({
  name,
  label,
  kind: 'json' as const,
  placeholder,
  minRows,
  maxRows,
  ...(patchPathPrefix !== undefined && { path: `${patchPathPrefix}.${String(name)}` }),
  defaultValue: '' as MonsterFormValues[K],
  parse: (v: unknown) => parseJson(v),
  format: (v: unknown) => formatJson(v),
});

export const MONSTER_FORM_FIELDS = [
  {
    name: 'name' as const,
    label: 'Name',
    kind: 'text' as const,
    required: true,
    placeholder: 'Monster name',
    defaultValue: '' as MonsterFormValues['name'],
    parse: (v: unknown) => (typeof v === 'string' ? v.trim() : undefined),
    format: (v: unknown) => (v != null ? String(v) : '') as MonsterFormValues['name'],
  },
  {
    name: 'type' as const,
    label: 'Type',
    kind: 'select' as const,
    options: MONSTER_TYPE_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    placeholder: 'Select type',
    defaultValue: '' as MonsterFormValues['type'],
    parse: (v: unknown) => (v ? (v as MonsterInput['type']) : undefined),
    format: (v: unknown) => (v ?? '') as MonsterFormValues['type'],
  },
  {
    name: 'sizeCategory' as const,
    label: 'Size Category',
    kind: 'select' as const,
    options: MONSTER_SIZE_CATEGORY_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
    placeholder: 'Select size',
    defaultValue: '' as MonsterFormValues['sizeCategory'],
    parse: (v: unknown) => (v ? (v as MonsterInput['sizeCategory']) : undefined),
    format: (v: unknown) => (v ?? '') as MonsterFormValues['sizeCategory'],
  },
  {
    name: 'imageKey' as const,
    label: 'Image',
    kind: 'imageUpload' as const,
    helperText: '/assets/... or CDN key',
    defaultValue: '' as MonsterFormValues['imageKey'],
    parse: (v: unknown) => trimOrNull(v) as MonsterInput['imageKey'],
    format: (v: unknown) => strOrEmpty(v) as MonsterFormValues['imageKey'],
  },
  jsonField('description', 'Description', JSON.stringify({ short: '', long: '' }, null, 2), 3, 6),
  jsonField('languages', 'Languages', '[]', 2, 4),
  jsonField('hitPoints', 'Hit Points', JSON.stringify({ count: 1, die: 8, modifier: 0 }, null, 2), 2, 4, 'mechanics'),
  jsonField('armorClass', 'Armor Class', JSON.stringify({ kind: 'natural' }, null, 2), 2, 4, 'mechanics'),
  jsonField('movement', 'Movement', JSON.stringify({ ground: 30 }, null, 2), 2, 4, 'mechanics'),
  jsonField('actions', 'Actions', '[]', 3, 12, 'mechanics'),
  jsonField('bonusActions', 'Bonus Actions', '[]', 2, 8, 'mechanics'),
  jsonField('legendaryActions', 'Legendary Actions', '{}', 2, 10, 'mechanics'),
  jsonField('traits', 'Traits', '[]', 2, 8, 'mechanics'),
  jsonField('abilities', 'Abilities', '{}', 2, 6, 'mechanics'),
  jsonField('senses', 'Senses', '{}', 2, 4, 'mechanics'),
  jsonField('proficiencies', 'Proficiencies', '{}', 2, 6, 'mechanics'),
  {
    name: 'proficiencyBonus' as const,
    label: 'Proficiency Bonus',
    kind: 'numberText' as const,
    path: 'mechanics.proficiencyBonus',
    placeholder: 'e.g. 2',
    defaultValue: '' as MonsterFormValues['proficiencyBonus'],
    required: true,
    validation: numberRange(PROFICIENCY_BONUS_MIN, PROFICIENCY_BONUS_MAX, { integer: true }),
    parse: (v: unknown) => {
      const n = numOrUndefined(v);
      if (n === undefined) return undefined;
      return isProficiencyBonus(n) ? n : undefined;
    },
    format: (v: unknown) => numToStr(v) as MonsterFormValues['proficiencyBonus'],
  },
  jsonField('equipment', 'Equipment', '{}', 2, 6, 'mechanics'),
  {
    name: 'immunities' as const,
    label: 'Immunities',
    kind: 'optionPicker' as const,
    path: 'mechanics.immunities',
    pickerOptions: CREATURE_IMMUNITY_PICKER_OPTIONS,
    valueMode: 'array' as const,
    renderSelectedAs: 'chip' as const,
    placeholder: 'Add immunities…',
    defaultValue: [] as unknown as MonsterFormValues['immunities'],
    helperText: 'Damage and condition types (e.g. poison, charmed) as in a stat block.',
  },
  {
    name: 'vulnerabilities' as const,
    label: 'Vulnerabilities',
    kind: 'optionPicker' as const,
    path: 'mechanics.vulnerabilities',
    pickerOptions: CREATURE_VULNERABILITY_PICKER_OPTIONS,
    valueMode: 'array' as const,
    renderSelectedAs: 'chip' as const,
    placeholder: 'Add damage vulnerabilities…',
    defaultValue: [] as unknown as MonsterFormValues['vulnerabilities'],
    helperText: 'Creature damage types that deal extra damage to this creature.',
  },
  {
    name: 'alignment' as const,
    label: 'Alignment',
    kind: 'select' as const,
    path: 'lore.alignment',
    options: getAlignmentFormSelectOptions(),
    placeholder: 'Select alignment',
    defaultValue: '' as MonsterFormValues['alignment'],
    parse: (v: unknown) => (v ? (v as AlignmentId) : undefined),
    format: (v: unknown) => (v != null ? String(v) : '') as MonsterFormValues['alignment'],
  },
  jsonField('challengeRating', 'Challenge Rating', '0.25', 1, 2, 'lore'),
  jsonField('xpValue', 'XP Value', '50', 1, 2, 'lore'),
  {
    name: 'accessPolicy' as const,
    label: 'Visibility',
    kind: 'visibility' as const,
    skipInForm: true,
    defaultValue: DEFAULT_VISIBILITY_PUBLIC as MonsterFormValues['accessPolicy'],
    parse: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as MonsterInput['accessPolicy'],
    format: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as MonsterFormValues['accessPolicy'],
  },
] as const satisfies readonly FieldSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>>[];
