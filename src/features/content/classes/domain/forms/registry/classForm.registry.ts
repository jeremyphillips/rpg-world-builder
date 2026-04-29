/**
 * Class form field registry — single source of truth for config + mapping.
 * Non-standard object and array fields use kind: 'json' per content form pattern.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { type FieldSpec } from '@/features/content/shared/forms/registry';
import type { ClassFormValues, ClassInput } from '../types/classForm.types';

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const trimOrNull = (v: unknown): string | null => (trim(v) ? trim(v) : null);
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');

const parseJsonObject = (v: unknown): unknown => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') return typeof v === 'object' && v !== null ? v : undefined;
  try {
    const parsed = JSON.parse(v) as unknown;
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const formatJsonObject = (v: unknown): string => {
  if (v == null) return '{}';
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return '{}';
    }
  }
  return '{}';
};

const DEFINITIONS_PLACEHOLDER = JSON.stringify(
  {
    id: 'subclass_selection',
    name: 'Subclass',
    selectionLevel: 3,
    options: [{ id: 'option_1', name: 'Option 1', source: 'PHB' }],
  },
  null,
 2
);

const REQUIREMENTS_PLACEHOLDER = JSON.stringify(
  { allowedRaces: 'all', allowedAlignments: 'any' },
  null,
  2
);

const PROFICIENCIES_PLACEHOLDER = JSON.stringify(
  {
    skills: { type: 'choice', choose: 2, level: 1 },
    weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
    armor: { type: 'fixed', level: 1, categories: ['light', 'medium'] },
  },
  null,
  2
);

const PROGRESSION_PLACEHOLDER = JSON.stringify(
  {
    hitDie: 8,
    attackProgression: 'good',
    savingThrows: ['str', 'dex'],
    spellcasting: 'none',
    asiLevels: [4, 8, 12, 16, 19],
    features: [{ id: 'feature_1', level: 1, name: 'Feature Name' }],
  },
  null,
  2
);

const GENERATION_PLACEHOLDER = JSON.stringify({ primaryAbilities: ['str', 'dex'] }, null, 2);

const DEFAULT_REQUIREMENTS_JSON = JSON.stringify(
  { allowedRaces: 'all', allowedAlignments: 'any' },
  null,
  2
);
const DEFAULT_PROFICIENCIES_JSON = JSON.stringify(
  {
    skills: { type: 'choice', choose: 2, level: 1 },
    weapons: { type: 'fixed', level: 1, categories: ['simple', 'martial'] },
    armor: { type: 'fixed', level: 1, categories: ['light', 'medium'] },
  },
  null,
  2
);
const DEFAULT_PROGRESSION_JSON = JSON.stringify(
  {
    hitDie: 8,
    attackProgression: 'good',
    savingThrows: ['str', 'dex'],
    spellcasting: 'none',
    asiLevels: [4, 8, 12, 16, 19],
    features: [],
  },
  null,
  2
);

export const CLASS_FORM_FIELDS = [
  {
    name: 'name',
    label: 'Name',
    kind: 'text' as const,
    required: true,
    placeholder: 'e.g. Fighter',
    defaultValue: '' as ClassFormValues['name'],
    parse: (v: unknown) => (trim(v) || undefined) as ClassInput['name'],
    format: (v: unknown) => strOrEmpty(v) as ClassFormValues['name'],
  },
  {
    name: 'description',
    label: 'Description',
    kind: 'textarea' as const,
    placeholder: 'Describe the class...',
    defaultValue: '' as ClassFormValues['description'],
    parse: (v: unknown) => (trim(v) || undefined) as ClassInput['description'],
    format: (v: unknown) => strOrEmpty(v) as ClassFormValues['description'],
  },
  {
    name: 'imageKey',
    label: 'Image',
    kind: 'imageUpload' as const,
    helperText: '/assets/... or CDN key',
    defaultValue: '' as ClassFormValues['imageKey'],
    parse: (v: unknown) => trimOrNull(v) as ClassInput['imageKey'],
    format: (v: unknown) => strOrEmpty(v) as ClassFormValues['imageKey'],
  },
  {
    name: 'accessPolicy',
    label: 'Visibility',
    kind: 'visibility' as const,
    skipInForm: true,
    defaultValue: DEFAULT_VISIBILITY_PUBLIC as ClassFormValues['accessPolicy'],
    parse: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as ClassInput['accessPolicy'],
    format: (v: unknown) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as ClassFormValues['accessPolicy'],
  },
  {
    name: 'generation',
    label: 'Generation',
    kind: 'json' as const,
    placeholder: GENERATION_PLACEHOLDER,
    helperText: 'Primary abilities for character generation.',
    minRows: 2,
    maxRows: 8,
    defaultValue: GENERATION_PLACEHOLDER as ClassFormValues['generation'],
    parse: (v: unknown) => parseJsonObject(v) as ClassInput['generation'],
    format: (v: unknown) => formatJsonObject(v) as ClassFormValues['generation'],
    formatForDisplay: (v: unknown) => {
      const obj = typeof v === 'object' && v !== null ? v : null;
      const arr = obj && 'primaryAbilities' in obj && Array.isArray((obj as { primaryAbilities?: unknown[] }).primaryAbilities)
        ? (obj as { primaryAbilities: string[] }).primaryAbilities
        : [];
      return arr.length > 0 ? arr.join(', ') : '—';
    },
  },
  {
    name: 'proficiencies',
    label: 'Proficiencies',
    kind: 'json' as const,
    placeholder: PROFICIENCIES_PLACEHOLDER,
    helperText: 'Skills, weapons, and armor proficiencies.',
    minRows: 6,
    maxRows: 16,
    defaultValue: DEFAULT_PROFICIENCIES_JSON as ClassFormValues['proficiencies'],
    parse: (v: unknown) => parseJsonObject(v) as ClassInput['proficiencies'],
    format: (v: unknown) => formatJsonObject(v) as ClassFormValues['proficiencies'],
    formatForDisplay: (v: unknown) =>
      v != null && typeof v === 'object' ? 'Configured' : '—',
  },
  {
    name: 'progression',
    label: 'Progression',
    kind: 'json' as const,
    placeholder: PROGRESSION_PLACEHOLDER,
    helperText: 'Hit die, features, spellcasting, ASI levels.',
    minRows: 8,
    maxRows: 24,
    defaultValue: DEFAULT_PROGRESSION_JSON as ClassFormValues['progression'],
    parse: (v: unknown) => parseJsonObject(v) as ClassInput['progression'],
    format: (v: unknown) => formatJsonObject(v) as ClassFormValues['progression'],
    formatForDisplay: (v: unknown) =>
      v != null && typeof v === 'object' ? 'Configured' : '—',
  },
  {
    name: 'definitions',
    label: 'Definitions',
    kind: 'json' as const,
    placeholder: DEFINITIONS_PLACEHOLDER,
    helperText: 'Subclass selection and options.',
    minRows: 6,
    maxRows: 24,
    defaultValue: '{}' as ClassFormValues['definitions'],
    parse: (v: unknown) => parseJsonObject(v) as ClassInput['definitions'],
    format: (v: unknown) => formatJsonObject(v) as ClassFormValues['definitions'],
    formatForDisplay: (v: unknown) => {
      const obj = typeof v === 'object' && v !== null ? v : null;
      const opts = obj && 'options' in obj && Array.isArray((obj as { options?: unknown[] }).options)
        ? (obj as { options: unknown[] }).options
        : [];
      return opts.length > 0 ? `${opts.length} option(s)` : '—';
    },
  },
  {
    name: 'requirements',
    label: 'Requirements',
    kind: 'json' as const,
    placeholder: REQUIREMENTS_PLACEHOLDER,
    helperText: 'Allowed races, alignments, multiclassing.',
    minRows: 4,
    maxRows: 16,
    defaultValue: DEFAULT_REQUIREMENTS_JSON as ClassFormValues['requirements'],
    parse: (v: unknown) => parseJsonObject(v) as ClassInput['requirements'],
    format: (v: unknown) => formatJsonObject(v) as ClassFormValues['requirements'],
    formatForDisplay: (v: unknown) =>
      v != null && typeof v === 'object' ? 'Configured' : '—',
  },
] as const satisfies readonly FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[];
