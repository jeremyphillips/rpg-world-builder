/**
 * Skill Proficiency form field registry — single source of truth for config + mapping.
 * JSON fields (examples, tags, suggestedClasses) use placeholders that FormJsonField
 * renders as "Insert example" in JsonPreviewField.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { SkillProficiency } from '@/features/content/shared/domain/types';
import type { SkillProficiencyInput } from '../types/skillProficiencyForm.types';
import { ABILITIES } from '@/features/mechanics/domain/core/character/abilities';
import { type FieldSpec } from '@/features/content/shared/forms/registry';
import type { SkillProficiencyFormValues } from '../types/skillProficiencyForm.types';

const ABILITY_OPTIONS = ABILITIES.map((a) => ({ value: a.id, label: a.name }));

const parseJsonArray = (v: unknown): string[] | undefined => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') return Array.isArray(v) ? (v as string[]) : undefined;
  try {
    const parsed = JSON.parse(v) as unknown;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const formatJsonArray = (v: unknown): string => {
  if (v == null || !Array.isArray(v)) return '[]';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '[]';
  }
};

/** Example for suggestedClasses — used as placeholder in FormJsonField. */
const SUGGESTED_CLASSES_EXAMPLE = '["barbarian", "fighter", "paladin"]';

/** Example for examples — used as placeholder in FormJsonField. */
const EXAMPLES_EXAMPLE = [
  'Climbing a sheer cliff or scaling a castle wall',
  'Swimming across a rushing river or escaping a whirlpool',
  'Grappling an opponent or breaking free from restraints',
];

/** Example for tags — used as placeholder in FormJsonField. */
const TAGS_EXAMPLE = ['physical', 'strength', 'climbing', 'swimming', 'grappling', 'athletic'];

export const SKILL_PROFICIENCY_FORM_FIELDS = [
  {
    name: 'name',
    label: 'Name',
    kind: 'text' as const,
    required: true,
    placeholder: 'e.g. Athletics',
    defaultValue: '' as SkillProficiencyFormValues['name'],
    parse: (v: unknown) => (typeof v === 'string' ? v.trim() : undefined),
    format: (v: unknown) => (v != null ? String(v) : '') as SkillProficiencyFormValues['name'],
  },
  {
    name: 'ability',
    label: 'Ability',
    kind: 'select' as const,
    required: true,
    options: ABILITY_OPTIONS,
    placeholder: 'Select ability',
    defaultValue: '' as SkillProficiencyFormValues['ability'],
    parse: (v: unknown) => (v ? (v as SkillProficiencyInput['ability']) : undefined),
    format: (v: unknown) => (v ?? '') as SkillProficiencyFormValues['ability'],
  },
  {
    name: 'description',
    label: 'Description',
    kind: 'textarea' as const,
    placeholder: 'Describe the skill...',
    defaultValue: '' as SkillProficiencyFormValues['description'],
    parse: (v: unknown) => (typeof v === 'string' ? v.trim() : undefined),
    format: (v: unknown) => (v != null ? String(v) : '') as SkillProficiencyFormValues['description'],
  },
  {
    name: 'suggestedClasses',
    label: 'Suggested Classes',
    kind: 'json' as const,
    placeholder: SUGGESTED_CLASSES_EXAMPLE,
    helperText: 'Class IDs that suggest this skill (e.g. barbarian, fighter).',
    minRows: 2,
    maxRows: 16,
    defaultValue: '[]' as SkillProficiencyFormValues['suggestedClasses'],
    parse: (v: unknown) => parseJsonArray(v),
    format: (v: unknown) => formatJsonArray(v),
    formatForDisplay: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [];
      return arr.length > 0 ? arr.join(', ') : '—';
    },
  },
  {
    name: 'examples',
    label: 'Examples',
    kind: 'json' as const,
    placeholder: JSON.stringify(EXAMPLES_EXAMPLE, null, 2),
    helperText: 'Example usage strings for this skill.',
    minRows: 4,
    maxRows: 16,
    defaultValue: '[]' as SkillProficiencyFormValues['examples'],
    parse: (v: unknown) => parseJsonArray(v),
    format: (v: unknown) => formatJsonArray(v),
    formatForDisplay: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [];
      return arr.length > 0 ? `${arr.length} example(s)` : '—';
    },
  },
  {
    name: 'tags',
    label: 'Tags',
    kind: 'json' as const,
    placeholder: JSON.stringify(TAGS_EXAMPLE, null, 2),
    helperText: 'Searchable tags for filtering.',
    minRows: 2,
    maxRows: 16,
    defaultValue: '[]' as SkillProficiencyFormValues['tags'],
    parse: (v: unknown) => parseJsonArray(v),
    format: (v: unknown) => formatJsonArray(v),
    formatForDisplay: (v: unknown) => {
      const arr = Array.isArray(v) ? v : [];
      return arr.length > 0 ? arr.join(', ') : '—';
    },
  },
  {
    name: 'accessPolicy',
    label: 'Visibility',
    kind: 'visibility' as const,
    skipInForm: true,
    defaultValue: DEFAULT_VISIBILITY_PUBLIC as SkillProficiencyFormValues['accessPolicy'],
    parse: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as SkillProficiencyInput['accessPolicy'],
    format: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as NonNullable<SkillProficiencyFormValues['accessPolicy']>,
  },
] as const satisfies readonly FieldSpec<
  SkillProficiencyFormValues,
  SkillProficiencyInput & Record<string, unknown>,
  SkillProficiency & Record<string, unknown>
>[];
