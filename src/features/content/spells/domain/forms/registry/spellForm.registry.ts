/**
 * Spell form field registry — single source of truth for config + mapping.
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { Spell, SpellInput } from '@/features/content/spells/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import { MAGIC_SCHOOL_OPTIONS } from '@/features/content/shared/domain/vocab';
import { numberRange, type FieldSpec } from '@/features/content/shared/forms/registry';
import { getSpellcastingClasses } from '@/features/mechanics/domain/classes';
import { getSystemClasses } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import { filterAllowedIds } from '@/features/content/shared/domain/utils';
import type { SpellFormValues } from '../types/spellForm.types';

export type SpellFormFieldsOptions = {
  /**
   * Campaign catalog `classesById`: merged system + campaign entries, already filtered by
   * content rules. When omitted, uses system spellcasting classes only (e.g. tooling without catalog).
   */
  classesById?: Record<string, CharacterClass> | undefined;
};

/**
 * Checkbox options + allowed-id map for the classes field.
 * With catalog: uses merged campaign classes and keeps only spellcasting progression.
 * Without catalog: system spellcasting classes only.
 */
export function buildSpellClassCheckboxOptions(
  classesById: Record<string, CharacterClass> | undefined,
): { options: { value: string; label: string }[]; allowedById: Record<string, unknown> } {
  if (classesById == null) {
    const spellcasting = getSpellcastingClasses([...getSystemClasses(DEFAULT_SYSTEM_RULESET_ID)]);
    const options = spellcasting.map((c) => ({ value: c.id, label: c.name }));
    return {
      options,
      allowedById: Object.fromEntries(options.map((o) => [o.value, true])),
    };
  }

  const spellcasting = getSpellcastingClasses(Object.values(classesById));
  const options = spellcasting
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return {
    options,
    allowedById: Object.fromEntries(options.map((o) => [o.value, true])),
  };
}

const numOrUndefined = (v: unknown): number | undefined => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

const arrOrEmpty = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : [];

const parseEffectsJson = (v: unknown): SpellInput['effects'] | undefined => {
  if (v == null || v === '') return undefined;
  if (typeof v !== 'string') return undefined;
  try {
    const parsed = JSON.parse(v) as unknown;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};
const formatEffectsJson = (v: unknown): string => {
  if (v == null || !Array.isArray(v)) return '[]';
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '[]';
  }
};

export function getSpellFormFields(
  options?: SpellFormFieldsOptions,
): FieldSpec<
  SpellFormValues,
  SpellInput & Record<string, unknown>,
  Spell & Record<string, unknown>
>[] {
  const { options: classOptions, allowedById } = buildSpellClassCheckboxOptions(
    options?.classesById,
  );

  return [
    ...getBaseContentFieldSpecs<
      SpellFormValues,
      Omit<SpellInput, 'description'> & Record<string, unknown>,
      Spell & Record<string, unknown>
    >(),
    {
      name: 'school',
      label: 'School',
      kind: 'select' as const,
      required: true,
      options: MAGIC_SCHOOL_OPTIONS.map((o) => ({ value: o.id, label: o.name })),
      placeholder: 'Select school',
      defaultValue: '' as SpellFormValues['school'],
      parse: (v: unknown) => (v ? (v as SpellInput['school']) : undefined),
      format: (v: unknown) => (v ?? '') as SpellFormValues['school'],
    },
    {
      name: 'level',
      label: 'Level',
      kind: 'numberText' as const,
      required: true,
      placeholder: '0–9 (0 = cantrip)',
      defaultValue: '0' as SpellFormValues['level'],
      validation: numberRange(0, 9, { integer: true }),
      parse: (v: unknown) => numOrUndefined(v),
      format: (v: unknown) => numToStr(v),
    },
    {
      name: 'classes',
      label: 'Classes',
      kind: 'checkboxGroup' as const,
      options: classOptions,
      defaultValue: [] as SpellFormValues['classes'],
      parse: (v: unknown) =>
        Array.isArray(v)
          ? (filterAllowedIds(v as string[], allowedById) as SpellInput['classes'])
          : undefined,
      format: (v: unknown) =>
        filterAllowedIds(arrOrEmpty(v), allowedById) as SpellInput['classes'],
    },
    // {
    //   name: 'ritual',
    //   label: 'Ritual',
    //   kind: 'checkbox' as const,
    //   defaultValue: false as SpellFormValues['ritual'],
    //   parse: (v: unknown) => Boolean(v),
    //   format: (v: unknown) => Boolean(v ?? false),
    //   formatForDisplay: (v: unknown) => (v ? 'Yes' : 'No'),
    // },
    // {
    //   name: 'concentration',
    //   label: 'Concentration',
    //   kind: 'checkbox' as const,
    //   defaultValue: false as SpellFormValues['concentration'],
    //   parse: (v: unknown) => Boolean(v),
    //   format: (v: unknown) => Boolean(v ?? false),
    //   formatForDisplay: (v: unknown) => (v ? 'Yes' : 'No'),
    // },
    {
      name: 'effects',
      label: 'Effects',
      kind: 'json' as const,
      placeholder: '[{ "kind": "note", "text": "..." }]',
      helperText:
        'Canonical effect objects with kind (e.g. note, modifier, grant, condition, save, activation).',
      minRows: 4,
      maxRows: 16,
      defaultValue: '[]' as SpellFormValues['effects'],
      parse: (v: unknown) => parseEffectsJson(v),
      format: (v: unknown) => formatEffectsJson(v),
      formatForDisplay: (v: unknown) => {
        const arr = Array.isArray(v) ? v : [];
        return arr.length > 0 ? `${arr.length} effect(s)` : '—';
      },
    },
  ];
}

/** Default field specs (full system spellcasting list). */
export const SPELL_FORM_FIELDS = getSpellFormFields();
