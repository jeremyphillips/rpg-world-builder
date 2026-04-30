/**
 * Class form field registry — single source of truth for config + mapping.
 * Non-standard object and array fields use kind: 'json' per content form pattern.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { ClassFeature } from '@/features/content/classes/domain/types/progression.types';
import type { Subclass } from '@/features/content/classes/domain/types/subclass.types';
import { ABILITIES } from '@/features/mechanics/domain/character';
import { DIE_FACES } from '@/shared/domain/dice';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import {
  createJsonFieldSpec,
  type FieldSpec,
  type FormNodeSpec,
} from '@/features/content/shared/forms/registry';
import {
  formatJsonObject,
  parseJsonObject,
  strOrEmpty,
  trim,
  trimOrNull,
} from '@/features/content/shared/forms/parsers';
import { createNamedDescriptionGroup } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';
import type { ClassFormValues, ClassInput } from '../types/classForm.types';

/**
 * Local wrapper around {@link createJsonFieldSpec} that pins generic params and
 * defaults the parser/formatter to the object-only variants used by class.
 *
 * @deprecated Transitional — fields move off `kind: 'json'` per phase plan.
 */
const classJsonField = <K extends keyof ClassFormValues>(
  name: K,
  options: {
    label: string;
    placeholder: string;
    helperText?: string;
    minRows?: number;
    maxRows?: number;
    defaultValue?: ClassFormValues[K];
    formatForDisplay?: (v: unknown) => React.ReactNode;
  },
): FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
> =>
  createJsonFieldSpec<
    ClassFormValues,
    ClassInput & Record<string, unknown>,
    CharacterClass & Record<string, unknown>,
    K
  >({
    name,
    parse: parseJsonObject,
    format: formatJsonObject,
    ...options,
  });

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
  classJsonField('generation', {
    label: 'Generation',
    placeholder: GENERATION_PLACEHOLDER,
    helperText: 'Primary abilities for character generation.',
    minRows: 2,
    maxRows: 8,
    defaultValue: GENERATION_PLACEHOLDER as ClassFormValues['generation'],
    formatForDisplay: (v) => {
      const obj = typeof v === 'object' && v !== null ? v : null;
      const arr =
        obj &&
        'primaryAbilities' in obj &&
        Array.isArray((obj as { primaryAbilities?: unknown[] }).primaryAbilities)
          ? (obj as { primaryAbilities: string[] }).primaryAbilities
          : [];
      return arr.length > 0 ? arr.join(', ') : '—';
    },
  }),
  classJsonField('proficiencies', {
    label: 'Proficiencies',
    placeholder: PROFICIENCIES_PLACEHOLDER,
    helperText: 'Skills, weapons, and armor proficiencies.',
    minRows: 6,
    maxRows: 16,
    defaultValue: DEFAULT_PROFICIENCIES_JSON as ClassFormValues['proficiencies'],
    formatForDisplay: (v) =>
      v != null && typeof v === 'object' ? 'Configured' : '—',
  }),
  classJsonField('requirements', {
    label: 'Requirements',
    placeholder: REQUIREMENTS_PLACEHOLDER,
    helperText: 'Allowed races, alignments, multiclassing.',
    minRows: 4,
    maxRows: 16,
    defaultValue: DEFAULT_REQUIREMENTS_JSON as ClassFormValues['requirements'],
    formatForDisplay: (v) =>
      v != null && typeof v === 'object' ? 'Configured' : '—',
  }),
] as const satisfies readonly FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[];

const PROGRESSION_FORM_GROUP = {
  id: 'class-progression',
  label: 'Progression',
  direction: 'column' as const,
};

const HIT_DIE_FIELD_OPTIONS = DIE_FACES.map((d) => ({
  value: String(d),
  label: `d${d}`,
}));

const ABILITY_SAVING_THROW_OPTIONS = ABILITIES.map((a) => ({
  value: a.id,
  label: a.name,
}));

const classProgressionFeaturesGroupInner = createNamedDescriptionGroup<
  ClassFeature & Record<string, unknown>,
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>({
  name: 'progressionFeatures',
  domainPath: 'progression.features',
  label: 'Class features',
  itemLabel: 'Feature',
  extras: [
    {
      name: 'id',
      label: 'Feature id',
      kind: 'text',
      required: true,
      defaultValue: '' as ClassFormValues['definitionsId'],
    },
    {
      name: 'level',
      label: 'Level',
      kind: 'numberText',
      required: true,
      defaultValue: '' as ClassFormValues['progressionExtraAttackLevel'],
    },
  ],
  ownedKeys: ['id', 'level', 'name', 'description'],
});

export const classProgressionFeaturesGroup = {
  ...classProgressionFeaturesGroupInner,
  defaultItem: {
    ...classProgressionFeaturesGroupInner.defaultItem,
    id: '',
    level: '',
  },
};

const CLASS_PROGRESSION_SCALAR_SPECS = [
  {
    name: 'progressionHitDie',
    label: 'Hit die',
    kind: 'select' as const,
    path: 'progression.hitDie',
    group: PROGRESSION_FORM_GROUP,
    options: HIT_DIE_FIELD_OPTIONS,
    placeholder: 'Select hit die',
    defaultValue: '8' as ClassFormValues['progressionHitDie'],
    patchBinding: {
      domainPath: 'progression.hitDie',
      parse: (v: unknown) =>
        (v == null ? '' : String(v)) as ClassFormValues['progressionHitDie'],
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        const n = Number(uiValue);
        if (!Number.isFinite(n)) return currentDomainValue;
        return n;
      },
    },
  },
  {
    name: 'progressionAttackProgression',
    label: 'Attack progression',
    kind: 'select' as const,
    path: 'progression.attackProgression',
    group: PROGRESSION_FORM_GROUP,
    options: [
      { value: 'good', label: 'Good' },
      { value: 'average', label: 'Average' },
      { value: 'poor', label: 'Poor' },
    ],
    placeholder: 'Select progression',
    defaultValue: 'good' as ClassFormValues['progressionAttackProgression'],
  },
  {
    name: 'progressionSpellcasting',
    label: 'Spellcasting',
    kind: 'select' as const,
    path: 'progression.spellcasting',
    group: PROGRESSION_FORM_GROUP,
    options: [
      { value: 'none', label: 'None' },
      { value: 'full', label: 'Full caster' },
      { value: 'half', label: 'Half caster' },
      { value: 'pact', label: 'Pact magic' },
    ],
    defaultValue: 'none' as ClassFormValues['progressionSpellcasting'],
  },
  {
    name: 'progressionSavingThrows',
    label: 'Saving throws',
    kind: 'checkboxGroup' as const,
    path: 'progression.savingThrows',
    group: PROGRESSION_FORM_GROUP,
    options: ABILITY_SAVING_THROW_OPTIONS,
    defaultValue: [] as ClassFormValues['progressionSavingThrows'],
  },
  {
    name: 'progressionAsiLevels',
    label: 'ASI levels',
    kind: 'text' as const,
    path: 'progression.asiLevels',
    group: PROGRESSION_FORM_GROUP,
    helperText: 'Comma-separated class levels (e.g. 4, 8, 12, 16, 19).',
    placeholder: '4, 8, 12, 16, 19',
    defaultValue: '' as ClassFormValues['progressionAsiLevels'],
    patchBinding: {
      domainPath: 'progression.asiLevels',
      parse: (v: unknown) =>
        (Array.isArray(v) ? (v as number[]).map(String).join(', ') : '') as ClassFormValues['progressionAsiLevels'],
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        if (typeof uiValue !== 'string' || uiValue.trim() === '') return undefined;
        const parts = uiValue
          .split(/[\s,]+/)
          .map((p) => p.trim())
          .filter(Boolean);
        const nums = parts
          .map((p) => Number(p))
          .filter((n) => Number.isFinite(n) && Number.isInteger(n));
        return nums.length > 0 ? nums : currentDomainValue;
      },
    },
  },
  {
    name: 'progressionExtraAttackLevel',
    label: 'Extra Attack level',
    kind: 'numberText' as const,
    path: 'progression.extraAttackLevel',
    group: PROGRESSION_FORM_GROUP,
    helperText: 'Leave empty if this class never gains Extra Attack.',
    defaultValue: '' as ClassFormValues['progressionExtraAttackLevel'],
    patchBinding: {
      domainPath: 'progression.extraAttackLevel',
      parse: (v: unknown) =>
        (v == null ? '' : String(v)) as ClassFormValues['progressionExtraAttackLevel'],
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        if (uiValue === '' || uiValue == null) return undefined;
        const n = Number(uiValue);
        if (!Number.isFinite(n)) return currentDomainValue;
        return n;
      },
    },
  },
] as const satisfies readonly FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[];

const DEFINITIONS_FORM_GROUP = {
  id: 'class-definitions',
  label: 'Definitions',
  direction: 'column' as const,
};

const classDefinitionsOptionsGroupInner =
  createNamedDescriptionGroup<
    Subclass,
    ClassFormValues,
    ClassInput & Record<string, unknown>,
    CharacterClass & Record<string, unknown>
  >({
    name: 'definitionsOptions',
    domainPath: 'definitions.options',
    label: 'Subclass options',
    itemLabel: 'Subclass option',
    extras: [
      {
        name: 'id',
        label: 'Option id',
        kind: 'text',
        required: true,
        defaultValue: '' as ClassFormValues['definitionsId'],
      },
    ],
    ownedKeys: ['id', 'name', 'description'],
  });

/**
 * Structured `definitions.options[]` — subclasses with merge-preserved extras (`features`, …).
 */
export const classDefinitionsOptionsGroup = {
  ...classDefinitionsOptionsGroupInner,
  defaultItem: {
    ...classDefinitionsOptionsGroupInner.defaultItem,
    id: '',
  },
};

const CLASS_DEFINITION_SCALAR_SPECS = [
  {
    name: 'definitionsId',
    label: 'Subclass selection id',
    kind: 'text' as const,
    path: 'definitions.id',
    placeholder: 'e.g. fighter_subclasses',
    group: DEFINITIONS_FORM_GROUP,
    defaultValue: '' as ClassFormValues['definitionsId'],
  },
  {
    name: 'definitionsName',
    label: 'Subclass selection name',
    kind: 'text' as const,
    path: 'definitions.name',
    placeholder: 'e.g. Fighter subclasses',
    group: DEFINITIONS_FORM_GROUP,
    defaultValue: '' as ClassFormValues['definitionsName'],
  },
  {
    name: 'definitionsSelectionLevel',
    label: 'Selection level',
    kind: 'numberText' as const,
    helperText: 'Character level when the player picks a subclass (leave empty if not used).',
    group: DEFINITIONS_FORM_GROUP,
    defaultValue: '' as ClassFormValues['definitionsSelectionLevel'],
    patchBinding: {
      domainPath: 'definitions.selectionLevel',
      parse: (v: unknown) =>
        v == null || v === '' ? '' : String(v) as ClassFormValues['definitionsSelectionLevel'],
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        if (uiValue === '' || uiValue == null) return null;
        const n = Number(uiValue);
        if (!Number.isFinite(n)) return currentDomainValue;
        return n;
      },
    },
  },
] as const satisfies readonly FieldSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[];

/**
 * Full layout: structured progression (Phase 3) + definitions block (Phase 2) after proficiencies JSON.
 */
export function getClassFormFields(): FormNodeSpec<
  ClassFormValues,
  ClassInput & Record<string, unknown>,
  CharacterClass & Record<string, unknown>
>[] {
  const out: FormNodeSpec<
    ClassFormValues,
    ClassInput & Record<string, unknown>,
    CharacterClass & Record<string, unknown>
  >[] = [];
  for (const spec of CLASS_FORM_FIELDS) {
    out.push(spec);
    if (spec.name === 'proficiencies') {
      out.push(...CLASS_PROGRESSION_SCALAR_SPECS);
      out.push(classProgressionFeaturesGroup);
      out.push(...CLASS_DEFINITION_SCALAR_SPECS);
      out.push(classDefinitionsOptionsGroup);
    }
  }
  return out;
}
