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
import { DEFAULT_VISIBILITY_PUBLIC, when } from '@/ui/patterns';
import {
  createJsonFieldSpec,
  numberRange,
  type FieldSpec,
  type FormNodeSpec,
} from '@/features/content/shared/forms/registry';
import { DIE_FACES } from '@/shared/domain/dice';
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
  stringifyLegendaryMetaEnvelope,
  parseLegendaryMetaJsonText,
  LEGENDARY_META_KEYS,
  monsterLegendaryNaturalActionsGroup,
  monsterLegendarySpecialActionsGroup,
  monsterMechanicsBonusNaturalActionsGroup,
  monsterMechanicsBonusSpecialActionsGroup,
  monsterMechanicsNaturalActionsGroup,
  monsterMechanicsSpecialActionsGroup,
} from '@/features/content/monsters/domain/forms/registry/monsterForm.actionPools';
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
const MONSTER_HIT_DIE_OPTIONS = DIE_FACES.map((d) => ({
  value: String(d),
  label: `d${d}`,
}));

const MONSTER_STAT_HIT_POINTS_GROUP = {
  id: 'monster-hit-points',
  label: 'Hit points',
  direction: 'row' as const,
};

const MONSTER_STAT_AC_GROUP = {
  id: 'monster-armor-class',
  label: 'Armor class',
  direction: 'row' as const,
};

const MONSTER_STAT_MOVEMENT_GROUP = {
  id: 'monster-movement',
  label: 'Movement (ft.)',
  direction: 'row' as const,
};

const MONSTER_STAT_ABILITIES_GROUP = {
  id: 'monster-abilities',
  label: 'Ability scores',
  direction: 'row' as const,
};

function legendaryActionsMetaField(): FieldSpec<
  MonsterFormValues,
  MonsterInput & Record<string, unknown>,
  Monster & Record<string, unknown>
> {
  return {
    name: 'legendaryActionsMeta',
    label: 'Legendary actions — uses & timing',
    kind: 'textarea',
    helperText:
      'JSON object: uses, optional usesInLair, timing, refresh, resolution. Inline legendary attacks are edited in structured groups.',
    defaultValue: '{\n  "uses": 0\n}' as MonsterFormValues['legendaryActionsMeta'],
    minRows: 2,
    maxRows: 6,
    parse: () => undefined,
    patchBinding: {
      domainPath: 'mechanics.legendaryActions',
      parse: (domainValue: unknown) => stringifyLegendaryMetaEnvelope(domainValue as Record<string, unknown> | undefined),
      serialize: (uiValue: unknown, currentDomainValue: unknown) => {
        const cur =
          currentDomainValue != null &&
          typeof currentDomainValue === 'object' &&
          !Array.isArray(currentDomainValue)
            ? (currentDomainValue as Record<string, unknown>)
            : { uses: 0, actions: [] };
        const drafted = parseLegendaryMetaJsonText(uiValue);
        const nextMeta: Record<string, unknown> = {};
        const dRec = drafted as Record<string, unknown>;
        for (const k of LEGENDARY_META_KEYS) {
          if (k in dRec && dRec[k] !== undefined) nextMeta[k as string] = dRec[k];
        }
        const actionsUnknown = cur.actions as unknown;
        const actionsArr = Array.isArray(actionsUnknown) ? actionsUnknown : [];
        return { ...cur, ...nextMeta, actions: actionsArr };
      },
    },
  };
}

/** Inserted between Phase 5 action pools and repeatable legendary slices (see {@link getMonsterFormFields}). */
export const monsterLegendaryMetaField = legendaryActionsMetaField();

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
  {
    name: 'hitPointsCount' as const,
    label: 'HP dice count',
    kind: 'numberText' as const,
    path: 'mechanics.hitPoints.count',
    group: MONSTER_STAT_HIT_POINTS_GROUP,
    placeholder: 'e.g. 20',
    defaultValue: '' as MonsterFormValues['hitPointsCount'],
    helperText: 'Number of Hit Dice.',
  },
  {
    name: 'hitPointsDie' as const,
    label: 'Hit die',
    kind: 'select' as const,
    path: 'mechanics.hitPoints.die',
    group: MONSTER_STAT_HIT_POINTS_GROUP,
    options: MONSTER_HIT_DIE_OPTIONS,
    placeholder: 'Die',
    defaultValue: '8' as MonsterFormValues['hitPointsDie'],
  },
  {
    name: 'hitPointsModifier' as const,
    label: 'HP modifier',
    kind: 'numberText' as const,
    path: 'mechanics.hitPoints.modifier',
    group: MONSTER_STAT_HIT_POINTS_GROUP,
    placeholder: 'e.g. 40',
    defaultValue: '' as MonsterFormValues['hitPointsModifier'],
    helperText: 'Added once to the rolled total (can be negative).',
  },
  {
    name: 'armorClassKind' as const,
    label: 'AC kind',
    kind: 'select' as const,
    path: 'mechanics.armorClass.kind',
    group: MONSTER_STAT_AC_GROUP,
    options: [
      { value: 'natural', label: 'Natural' },
      { value: 'equipment', label: 'Equipment' },
      { value: 'fixed', label: 'Fixed' },
    ],
    placeholder: 'Kind',
    defaultValue: 'natural' as MonsterFormValues['armorClassKind'],
    fieldDescription:
      'Equipment AC keeps armor references from the saved stat block; edit those in the Equipment JSON field until it is migrated.',
  },
  {
    name: 'armorClassNaturalOffset' as const,
    label: 'Natural bonus',
    kind: 'numberText' as const,
    path: 'mechanics.armorClass.offset',
    group: MONSTER_STAT_AC_GROUP,
    placeholder: 'Above baseline',
    defaultValue: '' as MonsterFormValues['armorClassNaturalOffset'],
    helperText: 'Points above unarmored baseline (omit for +0).',
    visibleWhen: when.eq('armorClassKind', 'natural'),
  },
  {
    name: 'armorClassFixedValue' as const,
    label: 'Fixed AC',
    kind: 'numberText' as const,
    path: 'mechanics.armorClass.value',
    group: MONSTER_STAT_AC_GROUP,
    placeholder: 'e.g. 19',
    defaultValue: '' as MonsterFormValues['armorClassFixedValue'],
    visibleWhen: when.eq('armorClassKind', 'fixed'),
  },
  {
    name: 'movementGround' as const,
    label: 'Walk',
    kind: 'numberText' as const,
    path: 'mechanics.movement.ground',
    group: MONSTER_STAT_MOVEMENT_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['movementGround'],
  },
  {
    name: 'movementSwim' as const,
    label: 'Swim',
    kind: 'numberText' as const,
    path: 'mechanics.movement.swim',
    group: MONSTER_STAT_MOVEMENT_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['movementSwim'],
  },
  {
    name: 'movementFly' as const,
    label: 'Fly',
    kind: 'numberText' as const,
    path: 'mechanics.movement.fly',
    group: MONSTER_STAT_MOVEMENT_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['movementFly'],
  },
  {
    name: 'movementClimb' as const,
    label: 'Climb',
    kind: 'numberText' as const,
    path: 'mechanics.movement.climb',
    group: MONSTER_STAT_MOVEMENT_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['movementClimb'],
  },
  {
    name: 'movementBurrow' as const,
    label: 'Burrow',
    kind: 'numberText' as const,
    path: 'mechanics.movement.burrow',
    group: MONSTER_STAT_MOVEMENT_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['movementBurrow'],
  },
  // Phase 5: canonical `actions` / `bonusActions` / repeatable legendary slices are appended in
  // `getMonsterFormFields()`; `monsterLegendaryMetaField` lands between bonus pools and those legendary groups.
  // `traits` migrated to a structured repeatable group; see `monsterTraitsGroup`
  // / `getMonsterFormFields()` below. Intentionally absent from this flat tuple
  // so `buildToInput` does not try to JSON-parse a `MonsterTraitFormRow[]`.
  {
    name: 'abilityStr' as const,
    label: 'Strength',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.str',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityStr'],
  },
  {
    name: 'abilityDex' as const,
    label: 'Dexterity',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.dex',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityDex'],
  },
  {
    name: 'abilityCon' as const,
    label: 'Constitution',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.con',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityCon'],
  },
  {
    name: 'abilityInt' as const,
    label: 'Intelligence',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.int',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityInt'],
  },
  {
    name: 'abilityWis' as const,
    label: 'Wisdom',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.wis',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityWis'],
  },
  {
    name: 'abilityCha' as const,
    label: 'Charisma',
    kind: 'numberText' as const,
    path: 'mechanics.abilities.cha',
    group: MONSTER_STAT_ABILITIES_GROUP,
    placeholder: '—',
    defaultValue: '' as MonsterFormValues['abilityCha'],
  },
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
  const idxAbilityStr = MONSTER_FORM_FIELDS.findIndex((s) => s.name === 'abilityStr');
  if (idxAbilityStr < 0) {
    throw new Error('monster registry: abilityStr anchor missing');
  }
  const prefixThroughMovement = MONSTER_FORM_FIELDS.slice(0, idxAbilityStr) as unknown as FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[];
  const fromAbilitiesOn = MONSTER_FORM_FIELDS.slice(idxAbilityStr) as unknown as FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[];

  const phase5AttackPools: FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[] = [
    monsterMechanicsSpecialActionsGroup,
    monsterMechanicsNaturalActionsGroup,
    monsterMechanicsBonusSpecialActionsGroup,
    monsterMechanicsBonusNaturalActionsGroup,
  ];

  const phase5Legendary: FormNodeSpec<
    MonsterFormValues,
    MonsterInput & Record<string, unknown>,
    Monster & Record<string, unknown>
  >[] = [
    monsterLegendaryMetaField,
    monsterLegendarySpecialActionsGroup,
    monsterLegendaryNaturalActionsGroup,
  ];

  return [...prefixThroughMovement, ...phase5AttackPools, ...phase5Legendary, monsterTraitsGroup, ...fromAbilitiesOn];
}
