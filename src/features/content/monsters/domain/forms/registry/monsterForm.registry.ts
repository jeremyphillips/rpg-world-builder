/**
 * Monster form field registry.
 *
 * Mix of flat {@link FieldSpec}s for scalar/JSON fields and structured
 * {@link RepeatableGroupSpec}s for migrated sections (Phase 1: `traits`).
 *
 * The flat tuple `MONSTER_FORM_FIELDS` is consumed by `buildToInput` /
 * `buildDefaultFormValues` for the non-structured fields. The `getMonsterFormFields()`
 * factory composes the same flat fields with structured groups into a `FormNodeSpec`
 * tree for `buildFormLayout` (which the route consumes).
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import {
  createJsonFieldSpec,
  numberRange,
  type FieldSpec,
  type FormNodeSpec,
} from '@/features/content/shared/forms/registry';
import {
  numOrUndefined,
  numToStr,
  strOrEmpty,
  trimOrNull,
} from '@/features/content/shared/forms/parsers';
import { createNamedDescriptionGroup } from '@/features/content/shared/forms/groups/createNamedDescriptionGroup';
import type { Monster, MonsterInput } from '@/features/content/monsters/domain/types';
import type { MonsterTrait } from '@/features/content/monsters/domain/types/monster-traits.types';
import type { MonsterFormValues } from '../types/monsterForm.types';
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
import {
  getCreatureSizeSelectOptions,
  getCreatureTypeSelectOptions,
} from '@/features/content/creatures/domain/options/creatureTaxonomyOptions';

type MonsterPatchPathPrefix = 'mechanics' | 'lore';

/**
 * Thin wrapper that pins the monster registry's generic params for
 * {@link createJsonFieldSpec} and the `patchPathPrefix` to the union of
 * monster-allowed prefixes (`mechanics` | `lore`).
 *
 * @deprecated Transitional — see {@link createJsonFieldSpec}.
 */
const jsonField = <K extends keyof MonsterFormValues>(
  name: K,
  label: string,
  placeholder: string,
  minRows = 2,
  maxRows = 8,
  patchPathPrefix?: MonsterPatchPathPrefix,
): FieldSpec<MonsterFormValues, MonsterInput & Record<string, unknown>, Monster & Record<string, unknown>> =>
  createJsonFieldSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>,
    K
  >({
    name,
    label,
    placeholder,
    minRows,
    maxRows,
    ...(patchPathPrefix !== undefined ? { patchPathPrefix } : {}),
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
    options: getCreatureTypeSelectOptions(),
    placeholder: 'Select type',
    defaultValue: '' as MonsterFormValues['type'],
    parse: (v: unknown) => (v ? (v as MonsterInput['type']) : undefined),
    format: (v: unknown) => (v ?? '') as MonsterFormValues['type'],
  },
  {
    name: 'subtype' as const,
    label: 'Subtype',
    kind: 'select' as const,
    options: [],
    placeholder: 'Select subtype (optional)',
    defaultValue: '' as MonsterFormValues['subtype'],
    parse: (v: unknown) => (v ? (v as MonsterInput['subtype']) : undefined),
    format: (v: unknown) => (v ?? '') as MonsterFormValues['subtype'],
  },
  {
    name: 'sizeCategory' as const,
    label: 'Size Category',
    kind: 'select' as const,
    options: getCreatureSizeSelectOptions(),
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
  // `traits` migrated to a structured repeatable group; see `monsterTraitsGroup`
  // / `getMonsterFormFields()` below. Intentionally absent from this flat tuple
  // so `buildToInput` does not try to JSON-parse a `MonsterTraitFormRow[]`.
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
    options: [],
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

/**
 * Structured repeatable group for `mechanics.traits[]` (Phase 1 pilot).
 *
 * MVP authors `name` + `description` only; domain extras (`trigger`, `effects`,
 * `uses`, `resolution.caveats`, …) are preserved per row at save time via
 * `mergePreserveExtras` (see {@link toMonsterInput}).
 */
export const monsterTraitsGroup = createNamedDescriptionGroup<
  MonsterTrait,
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
>({
  name: 'traits',
  domainPath: 'mechanics.traits',
  itemLabel: 'Trait',
  label: 'Traits',
});

/**
 * Returns the full FormNodeSpec tree for monster Create/Edit forms — flat
 * fields + structured groups (currently just `traits`). Consumed by
 * `getMonsterFieldConfigs` via `buildFormLayout`.
 *
 * Insertion point for `traits` mirrors the legacy `jsonField('traits', …)`
 * position so the on-screen field order is preserved.
 */
export function getMonsterFormFields(): FormNodeSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
>[] {
  const before: FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[] = [];
  const after: FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[] = [];
  let seenLegendary = false;
  for (const spec of MONSTER_FORM_FIELDS) {
    if (seenLegendary) {
      after.push(spec);
    } else {
      before.push(spec);
      if (spec.name === 'legendaryActions') seenLegendary = true;
    }
  }
  return [...before, monsterTraitsGroup, ...after];
}
