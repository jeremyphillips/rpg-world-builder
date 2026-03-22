/**
 * Monster form field registry.
 * Standard fields (name, type, sizeCategory) + individual JSON fields for each mechanics/lore subfield.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import type { MonsterFormValues } from '../types/monsterForm.types';
import { MONSTER_TYPE_OPTIONS, MONSTER_SIZE_CATEGORY_OPTIONS } from '@/features/content/monsters/domain/vocab/monster.vocab';

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

const jsonField = <K extends keyof MonsterFormValues>(
  name: K,
  label: string,
  placeholder: string,
  minRows = 2,
  maxRows = 8
): FieldSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>> => ({
  name,
  label,
  kind: 'json' as const,
  placeholder,
  minRows,
  maxRows,
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
  jsonField('description', 'Description', JSON.stringify({ short: '', long: '' }, null, 2), 3, 6),
  jsonField('languages', 'Languages', '[]', 2, 4),
  jsonField('hitPoints', 'Hit Points', JSON.stringify({ count: 1, die: 8, modifier: 0 }, null, 2), 2, 4),
  jsonField('armorClass', 'Armor Class', JSON.stringify({ kind: 'natural' }, null, 2), 2, 4),
  jsonField('movement', 'Movement', JSON.stringify({ ground: 30 }, null, 2), 2, 4),
  jsonField('actions', 'Actions', '[]', 3, 12),
  jsonField('bonusActions', 'Bonus Actions', '[]', 2, 8),
  jsonField('legendaryActions', 'Legendary Actions', '{}', 2, 10),
  jsonField('traits', 'Traits', '[]', 2, 8),
  jsonField('abilities', 'Abilities', '{}', 2, 6),
  jsonField('senses', 'Senses', '{}', 2, 4),
  jsonField('proficiencies', 'Proficiencies', '{}', 2, 6),
  jsonField('proficiencyBonus', 'Proficiency Bonus', '2', 1, 2),
  jsonField('equipment', 'Equipment', '{}', 2, 6),
  jsonField('immunities', 'Immunities', '[]', 2, 4),
  jsonField('vulnerabilities', 'Vulnerabilities', '[]', 2, 4),
  jsonField('alignment', 'Alignment', '"n"', 1, 2),
  jsonField('challengeRating', 'Challenge Rating', '0.25', 1, 2),
  jsonField('xpValue', 'XP Value', '50', 1, 2),
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
