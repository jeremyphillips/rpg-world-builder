/**
 * Spell form field registry — simple FieldSpecs + composite UI fields (no parse; assembly handles nested domain).
 */
import type { CharacterClass } from '@/features/content/classes/domain/types';
import type { Spell, SpellInput } from '@/features/content/spells/domain/types';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { when } from '@/ui/patterns';
import type {
  FieldSpec,
  FormNodeSpec,
  RepeatableGroupSpec,
} from '@/features/content/shared/forms/registry';
import {
  TARGET_ELIGIBILITY_DEFINITIONS,
  TARGET_SELECTION_DEFINITIONS,
} from '@/features/content/shared/domain/vocab/spellTargeting.vocab';
import { getSpellcastingClasses } from '@/features/mechanics/domain/classes';
import { getSystemClasses } from '@/features/mechanics/domain/rulesets/system/classes';
import { DEFAULT_SYSTEM_RULESET_ID } from '@/features/mechanics/domain/rulesets/ids/systemIds';
import type { SpellFormValues } from '../types/spellForm.types';

export const SPELL_EFFECT_KIND_OPTIONS = [
  { value: 'damage', label: 'Damage' },
  { value: 'condition', label: 'Condition' },
] as const;
import { spellComponentsPatchBindings } from '../spellComponentsPatchBinding';
import {
  formatSpellLevelShort,
  isSpellLevel,
  SPELL_CORE_UI,
  SPELL_LEVEL_DEFINITIONS,
} from '../../spellPresentation';
import {
  SPELL_CASTING_TIME_UNIT_OPTIONS,
  SPELL_COMPONENT_CHECKBOX_OPTIONS,
  SPELL_DURATION_KIND_SELECT_OPTIONS,
  SPELL_MATERIAL_COIN_OPTIONS,
  SPELL_RANGE_KIND_SELECT_OPTIONS,
  SPELL_SCHOOL_SELECT_OPTIONS,
  SPELL_DISTANCE_UNIT_OPTIONS,
  SPELL_TIME_UNIT_OPTIONS,
  SPELL_TRIGGER_SELECT_OPTIONS,
} from '../options/spellForm.options';

const SPELL_LEVEL_SELECT_OPTIONS = SPELL_LEVEL_DEFINITIONS.map((row) => ({
  value: String(row.id),
  label: formatSpellLevelShort(row.id),
}));

export type SpellFormFieldsOptions = {
  classesById?: Record<string, CharacterClass> | undefined;
};

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

const numToStr = (v: unknown): string =>
  v != null && Number.isFinite(Number(v)) ? String(v) : '';

const arrOrEmpty = (v: unknown): string[] =>
  Array.isArray(v) ? (v as string[]) : [];

const trim = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const strOrEmpty = (v: unknown): string => (v != null ? String(v) : '');
const trimOrNull = (v: unknown): string | null => (trim(v) ? trim(v) : null);

const parseEffectGroupsForInput = (v: unknown): SpellInput['effectGroups'] | undefined => {
  if (v == null) return undefined;
  if (!Array.isArray(v)) return undefined;
  return v as SpellInput['effectGroups'];
};

const formatEffectGroupsForForm = (v: unknown): SpellFormValues['effectGroups'] => {
  if (v == null || !Array.isArray(v)) return [];
  return v as SpellFormValues['effectGroups'];
};

function buildSpellEffectGroupsFormNode(): RepeatableGroupSpec<
  SpellFormValues,
  SpellInput & Record<string, unknown>,
  Spell & Record<string, unknown>
> {
  const selectionOptions = TARGET_SELECTION_DEFINITIONS.map((d) => ({
    value: d.id,
    label: d.name,
  }));
  const eligibilityOptions = TARGET_ELIGIBILITY_DEFINITIONS.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return {
    kind: 'repeatable-group',
    name: 'effectGroups',
    label: 'Effect groups',
    itemLabel: 'Effect group',
    patchBinding: {
      domainPath: 'effectGroups',
      parse: (v) => (Array.isArray(v) ? v : []),
      serialize: (ui, _cur) => ui,
    },
    children: [
      {
        name: 'targeting.selection',
        label: 'Selection',
        kind: 'select',
        options: selectionOptions,
        defaultFromOptions: 'first',
        placeholder: 'Selection',
      },
      {
        name: 'targeting.targetType',
        label: 'Target type',
        kind: 'select',
        options: eligibilityOptions,
        defaultFromOptions: 'first',
        placeholder: 'Target type',
      },
      {
        kind: 'repeatable-group',
        name: 'effects',
        label: 'Effects',
        itemLabel: 'Effect',
        children: [
          {
            name: 'kind',
            label: 'Kind',
            kind: 'select',
            options: [...SPELL_EFFECT_KIND_OPTIONS],
            defaultFromOptions: 'first',
            placeholder: 'Kind',
          },
        ],
      },
    ],
  };
}

/**
 * FieldSpecs whose `parse` maps directly onto SpellInput keys (plus name/image/access).
 */
export function getSpellSimpleFieldSpecs(
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
    {
      name: 'name',
      label: 'Name',
      kind: 'text' as const,
      required: true,
      placeholder: 'Spell name',
      defaultValue: '' as SpellFormValues['name'],
      parse: (v) => trim(v) as SpellInput['name'],
      format: (v) => strOrEmpty(v) as SpellFormValues['name'],
    },
    {
      name: 'imageKey',
      label: 'Image',
      kind: 'imageUpload' as const,
      helperText: '/assets/... or CDN key',
      defaultValue: '' as SpellFormValues['imageKey'],
      parse: (v) => trimOrNull(v) as SpellInput['imageKey'],
      format: (v) => strOrEmpty(v) as SpellFormValues['imageKey'],
    },
    {
      name: 'accessPolicy',
      label: 'Visibility',
      kind: 'visibility' as const,
      skipInForm: true,
      defaultValue: DEFAULT_VISIBILITY_PUBLIC as SpellFormValues['accessPolicy'],
      parse: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as SpellInput['accessPolicy'],
      format: (v) => (v ?? DEFAULT_VISIBILITY_PUBLIC) as SpellFormValues['accessPolicy'],
    },
    {
      name: SPELL_CORE_UI.school.key,
      label: 'School',
      kind: 'select' as const,
      required: true,
      options: SPELL_SCHOOL_SELECT_OPTIONS,
      placeholder: 'Select school',
      defaultValue: '' as SpellFormValues['school'],
      parse: (v: unknown) => (v ? (v as SpellInput['school']) : undefined),
      format: (v: unknown) => (v ?? '') as SpellFormValues['school'],
      group: {
        id: 'spellSchoolLevel',
        label: 'School & level',
        direction: 'row',
        spacing: 2,
      },
      width: 6,
    },
    {
      name: SPELL_CORE_UI.level.key,
      label: 'Level',
      kind: 'select' as const,
      required: true,
      options: SPELL_LEVEL_SELECT_OPTIONS,
      placeholder: 'Select level',
      // defaultValue: String(SPELL_LEVEL_DEFINITIONS[0].id) as SpellFormValues['level'],
      parse: (v: unknown) => {
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return isSpellLevel(n) ? (n as SpellInput['level']) : undefined;
      },
      format: (v: unknown) => numToStr(v),
      group: {
        id: 'spellSchoolLevel',
        direction: 'row',
        spacing: 2,
      },
      width: 6,
    },
    {
      name: SPELL_CORE_UI.classes.key,
      label: SPELL_CORE_UI.classes.label,
      kind: 'checkboxGroup' as const,
      options: classOptions,
      defaultValue: [] as SpellFormValues['classes'],
      parse: (v: unknown) =>
        Array.isArray(v)
          ? ((v as string[]).filter((id) => id in allowedById) as SpellInput['classes'])
          : undefined,
      format: (v: unknown) =>
        arrOrEmpty(v).filter((id) => id in allowedById) as SpellFormValues['classes'],
    },
    {
      name: 'effectGroups',
      label: 'Effect groups',
      kind: 'text' as const,
      skipInForm: true,
      parse: (v: unknown) => parseEffectGroupsForInput(v),
      format: (v: unknown) => formatEffectGroupsForForm(v),
      formatForDisplay: (v: unknown) => {
        const arr = Array.isArray(v) ? v : [];
        return arr.length > 0 ? `${arr.length} group(s)` : '—';
      },
    },
  ];
}

function pickSpellFieldsByName(
  specs: FieldSpec<
    SpellFormValues,
    SpellInput & Record<string, unknown>,
    Spell & Record<string, unknown>
  >[],
  names: readonly string[],
): FieldSpec<
  SpellFormValues,
  SpellInput & Record<string, unknown>,
  Spell & Record<string, unknown>
>[] {
  return names
    .map((n) => specs.find((f) => f.name === n))
    .filter(
      (
        f,
      ): f is FieldSpec<
        SpellFormValues,
        SpellInput & Record<string, unknown>,
        Spell & Record<string, unknown>
      > => f != null,
    );
}

const GROUP_CASTING = {
  id: 'castingTime',
  label: 'Casting time',
  direction: 'row' as const,
  spacing: 2,
};

const GROUP_DURATION = {
  id: 'duration',
  label: 'Duration',
  direction: 'row' as const,
  spacing: 2,
};

const GROUP_RANGE = {
  id: 'spellRange',
  label: 'Range',
  direction: 'row' as const,
  spacing: 2,
};

const GROUP_TURN_BOUNDARY = {
  id: 'durationTurnBoundary',
  label: 'Turn boundary',
  direction: 'row' as const,
  spacing: 2,
};

const GROUP_MATERIAL = {
  id: 'material',
  label: 'Material',
  direction: 'row' as const,
  spacing: 2,
};

function compositeFieldSpecs(): FieldSpec<
  SpellFormValues,
  SpellInput & Record<string, unknown>,
  Spell & Record<string, unknown>
>[] {
  return [
    {
      name: 'castingTimeUnit',
      path: 'castingTime.normal.unit',
      label: 'Unit',
      placeholder: 'Select unit',
      kind: 'select' as const,
      required: true,
      options: SPELL_CASTING_TIME_UNIT_OPTIONS,
      //defaultValue: '',
      defaultValue: 'action' as SpellFormValues['castingTimeUnit'],
      group: GROUP_CASTING,
      width: 4,
    },
    {
      name: 'castingTimeValue',
      path: 'castingTime.normal.value',
      label: 'Value',
      kind: 'numberText' as const,
      helperText: 'Minute / hour casts',
      defaultValue: '1' as SpellFormValues['castingTimeValue'],
      visibleWhen: when.or(
        when.eq('castingTimeUnit', 'minute'),
        when.eq('castingTimeUnit', 'hour'),
      ),
      group: GROUP_CASTING,
      width: 2,
    },
    {
      name: 'castingTimeTrigger',
      path: 'castingTime.normal.trigger',
      label: 'Trigger',
      kind: 'select' as const,
      options: SPELL_TRIGGER_SELECT_OPTIONS,
      placeholder: 'Select trigger',
      defaultValue: '' as SpellFormValues['castingTimeTrigger'],
      visibleWhen: when.eq('castingTimeUnit', 'reaction'),
      group: GROUP_CASTING,
      width: 4,
    },
    {
      name: 'castingTimeCanRitual',
      path: 'castingTime.canBeCastAsRitual',
      label: 'Ritual',
      kind: 'checkbox' as const,
      defaultValue: false as SpellFormValues['castingTimeCanRitual'],
      group: GROUP_CASTING,
      width: 4,
    },
    {
      name: 'durationKind',
      path: 'duration.kind',
      label: 'Kind',
      kind: 'select' as const,
      required: true,
      options: SPELL_DURATION_KIND_SELECT_OPTIONS,
      defaultValue: 'instantaneous' as SpellFormValues['durationKind'],
      group: GROUP_DURATION,
      width: 4,
    },
    {
      name: 'durationTimedValue',
      path: 'duration.value',
      label: 'Value',
      kind: 'numberText' as const,
      defaultValue: '1' as SpellFormValues['durationTimedValue'],
      visibleWhen: when.eq('durationKind', 'timed'),
      group: GROUP_DURATION,
      width: 2,
    },
    {
      name: 'durationTimedUnit',
      path: 'duration.unit',
      label: 'Unit',
      kind: 'select' as const,
      options: SPELL_TIME_UNIT_OPTIONS,
      defaultValue: 'minute' as SpellFormValues['durationTimedUnit'],
      visibleWhen: when.eq('durationKind', 'timed'),
      group: GROUP_DURATION,
      width: 2,
    },
    {
      name: 'durationTimedUpTo',
      path: 'duration.upTo',
      label: 'Up to',
      kind: 'checkbox' as const,
      defaultValue: false as SpellFormValues['durationTimedUpTo'],
      visibleWhen: when.eq('durationKind', 'timed'),
      group: GROUP_DURATION,
      width: 2,
    },
    {
      name: 'durationConcentration',
      path: 'duration.concentration',
      label: 'Concentration',
      kind: 'checkbox' as const,
      defaultValue: false as SpellFormValues['durationConcentration'],
      visibleWhen: when.neq('durationKind', 'instantaneous'),
      group: GROUP_DURATION,
      width: 12,
    },
    {
      name: 'durationSpecialText',
      path: 'duration.description',
      label: 'Special duration text',
      kind: 'textarea' as const,
      defaultValue: '' as SpellFormValues['durationSpecialText'],
      visibleWhen: when.eq('durationKind', 'special'),
    },
    {
      name: 'durationUntilTriggeredText',
      path: 'duration.description',
      label: 'Until triggered (description)',
      kind: 'textarea' as const,
      defaultValue: '' as SpellFormValues['durationUntilTriggeredText'],
      visibleWhen: when.eq('durationKind', 'until-triggered'),
    },
    {
      name: 'durationTurnBoundarySubject',
      path: 'duration.subject',
      label: 'Subject',
      kind: 'select' as const,
      options: [
        { value: 'self', label: 'Self' },
        { value: 'source', label: 'Source' },
        { value: 'target', label: 'Target' },
      ],
      defaultValue: 'self' as SpellFormValues['durationTurnBoundarySubject'],
      visibleWhen: when.eq('durationKind', 'until-turn-boundary'),
      group: GROUP_TURN_BOUNDARY,
      width: 4,
    },
    {
      name: 'durationTurnBoundaryTurn',
      path: 'duration.turn',
      label: 'Turn',
      kind: 'select' as const,
      options: [
        { value: 'current', label: 'Current' },
        { value: 'next', label: 'Next' },
      ],
      defaultValue: 'current' as SpellFormValues['durationTurnBoundaryTurn'],
      visibleWhen: when.eq('durationKind', 'until-turn-boundary'),
      group: GROUP_TURN_BOUNDARY,
      width: 4,
    },
    {
      name: 'durationTurnBoundaryBoundary',
      path: 'duration.boundary',
      label: 'Boundary',
      kind: 'select' as const,
      options: [
        { value: 'start', label: 'Start' },
        { value: 'end', label: 'End' },
      ],
      defaultValue: 'end' as SpellFormValues['durationTurnBoundaryBoundary'],
      visibleWhen: when.eq('durationKind', 'until-turn-boundary'),
      group: GROUP_TURN_BOUNDARY,
      width: 4,
    },
    {
      name: 'rangeKind',
      path: 'range.kind',
      label: 'Kind',
      kind: 'select' as const,
      required: true,
      options: SPELL_RANGE_KIND_SELECT_OPTIONS,
      defaultValue: 'self' as SpellFormValues['rangeKind'],
      group: GROUP_RANGE,
      width: 4,
    },
    {
      name: 'rangeDistanceValue',
      path: 'range.value.value',
      label: 'Distance',
      kind: 'numberText' as const,
      defaultValue: '' as SpellFormValues['rangeDistanceValue'],
      visibleWhen: when.eq('rangeKind', 'distance'),
      group: GROUP_RANGE,
      width: 2,
    },
    {
      name: 'rangeDistanceUnit',
      path: 'range.value.unit',
      label: 'Unit',
      kind: 'select' as const,
      options: SPELL_DISTANCE_UNIT_OPTIONS,
      defaultValue: 'ft' as SpellFormValues['rangeDistanceUnit'],
      visibleWhen: when.eq('rangeKind', 'distance'),
      group: GROUP_RANGE,
      width: 2,
    },
    {
      name: 'rangeSpecialDescription',
      path: 'range.description',
      label: 'Special',
      kind: 'text' as const,
      defaultValue: '' as SpellFormValues['rangeSpecialDescription'],
      visibleWhen: when.eq('rangeKind', 'special'),
      group: GROUP_RANGE,
      width: 8,
    },
    {
      name: 'componentIds',
      label: 'Components',
      kind: 'checkboxGroup' as const,
      options: SPELL_COMPONENT_CHECKBOX_OPTIONS,
      defaultValue: [] as SpellFormValues['componentIds'],
      patchBinding: spellComponentsPatchBindings.componentIds,
    },
    {
      name: 'materialDescription',
      label: 'Description',
      kind: 'text' as const,
      defaultValue: '' as SpellFormValues['materialDescription'],
      visibleWhen: when.contains('componentIds', 'material'),
      group: GROUP_MATERIAL,
      width: 4,
      patchBinding: spellComponentsPatchBindings.materialDescription,
    },
    {
      name: 'materialCostValue',
      label: 'Cost',
      kind: 'numberText' as const,
      defaultValue: '' as SpellFormValues['materialCostValue'],
      visibleWhen: when.contains('componentIds', 'material'),
      group: GROUP_MATERIAL,
      width: 2,
      patchBinding: spellComponentsPatchBindings.materialCostValue,
    },
    {
      name: 'materialCostUnit',
      label: 'Coin',
      kind: 'select' as const,
      options: SPELL_MATERIAL_COIN_OPTIONS,
      defaultValue: 'gp' as SpellFormValues['materialCostUnit'],
      visibleWhen: when.contains('componentIds', 'material'),
      group: GROUP_MATERIAL,
      width: 2,
      patchBinding: spellComponentsPatchBindings.materialCostUnit,
    },
    {
      name: 'materialConsumed',
      label: 'Consumed',
      kind: 'checkbox' as const,
      defaultValue: false as SpellFormValues['materialConsumed'],
      visibleWhen: when.contains('componentIds', 'material'),
      group: GROUP_MATERIAL,
      width: 4,
      patchBinding: spellComponentsPatchBindings.materialConsumed,
    },
    {
      name: 'descriptionFull',
      path: 'description.full',
      label: 'Full',
      kind: 'textarea' as const,
      placeholder: 'Full spell description',
      defaultValue: '' as SpellFormValues['descriptionFull'],
      group: {
        id: 'spellDescription',
        label: 'Description',
        direction: 'column',
        spacing: 2,
      },
    },
    {
      name: 'descriptionSummary',
      path: 'description.summary',
      label: 'Short',
      kind: 'text' as const,
      placeholder: 'Short summary',
      defaultValue: '' as SpellFormValues['descriptionSummary'],
      group: { id: 'spellDescription', direction: 'column', spacing: 2 },
    }
  ];
}

export function getSpellFormFields(
  options?: SpellFormFieldsOptions,
): FormNodeSpec<
  SpellFormValues,
  SpellInput & Record<string, unknown>,
  Spell & Record<string, unknown>
>[] {
  const simple = getSpellSimpleFieldSpecs(options);
  const composite = compositeFieldSpecs();

  /** Top: identity + school/level + visibility + classes; bottom: effects then image (after composite blocks). */
  const headNames = [
    'name',
    SPELL_CORE_UI.school.key,
    SPELL_CORE_UI.level.key,
    'accessPolicy',
    SPELL_CORE_UI.classes.key,
  ] as const;
  const tailNames = ['imageKey'] as const;

  return [
    ...pickSpellFieldsByName(simple, headNames),
    ...composite,
    buildSpellEffectGroupsFormNode(),
    ...pickSpellFieldsByName(simple, tailNames),
  ];
}

export const SPELL_FORM_FIELDS = getSpellFormFields();
