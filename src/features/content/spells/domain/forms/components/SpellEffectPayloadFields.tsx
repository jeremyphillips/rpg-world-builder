import type { ReactElement } from 'react';
import { useWatch } from 'react-hook-form';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { DynamicFormRenderer, type FieldConfig } from '@/ui/patterns';
import DynamicField from '@/ui/patterns/form/DynamicField';
import DriverField from '@/ui/patterns/form/DriverField';
import type { PatchDriver } from '@/ui/patterns/form/patchDriver.types';
import { DIE_FACE_OPTIONS } from '@/features/content/shared/forms/dice/diceOptions';
import { DAMAGE_TYPE_SELECT_OPTIONS } from '@/features/content/shared/domain/vocab/damage';
import { EFFECT_CONDITION_DEFINITIONS } from '@/features/content/shared/domain/vocab/effectConditions.vocab';
import { RESOURCE_RECHARGE_OPTIONS } from '@/features/content/shared/domain/vocab/resourceRecharge.vocab';

const STUB_MSG =
  'Advanced — full authoring for this effect kind is not available in this editor version yet. This row will not be saved to the spell until supported.';

const DAMAGE_FORMAT_OPTIONS = [
  { value: 'dice', label: 'Dice' },
  { value: 'flat', label: 'Flat' },
] as const;

/**
 * Matches spell form registry pattern (e.g. GROUP_RANGE). `width` on fields only applies when
 * `direction` is `row` — DynamicFormRenderer uses Grid for row groups, Stack (full width) for column.
 */
const GROUP_SPELL_EFFECT_DAMAGE = {
  id: 'spellEffectDamage',
  label: 'Damage',
  direction: 'row' as const,
  spacing: 2,
};

function joinPrefix(prefix: string, name: string): string {
  return `${prefix}.${name}`;
}

function PrefixedDynamicField({
  namePrefix,
  relativeName,
  field,
}: {
  namePrefix: string;
  relativeName: string;
  field: FieldConfig;
}): ReactElement {
  const full: FieldConfig = {
    ...field,
    name: joinPrefix(namePrefix, relativeName),
  };
  return <DynamicField field={full} />;
}

function PrefixedDriverField({
  namePrefix,
  relativeName,
  field,
  driver,
}: {
  namePrefix: string;
  relativeName: string;
  field: FieldConfig;
  driver: PatchDriver;
}): ReactElement {
  const full: FieldConfig = {
    ...field,
    name: joinPrefix(namePrefix, relativeName),
  };
  return <DriverField field={full} driver={driver} />;
}

function buildSpellDamageFormFields(
  namePrefix: string,
  fmt: string,
  damageTypeOptions: { value: string; label: string }[],
): FieldConfig[] {
  const fieldName = (relativeName: string): string => joinPrefix(namePrefix, relativeName);
  const g = GROUP_SPELL_EFFECT_DAMAGE;

  const damageTypeField: FieldConfig = {
    name: fieldName('damageType'),
    label: 'Damage type',
    type: 'select',
    options: damageTypeOptions,
    placeholder: 'Optional',
    group: g,
    /** Full row under format/dice controls (Grid wraps after 12 columns). */
    width: 3,
  };

  const formatField: FieldConfig = {
    name: fieldName('damageFormat'),
    label: 'Format',
    type: 'select',
    options: [...DAMAGE_FORMAT_OPTIONS],
    defaultFromOptions: 'first',
    group: g,
  };

  if (fmt === 'flat') {
    return [
      { ...formatField, width: 2 },
      {
        name: fieldName('damageFlatValue'),
        label: 'Value',
        type: 'text',
        inputType: 'number',
        placeholder: 'e.g. 8',
        group: g,
        width: 1,
      },
      damageTypeField,
    ];
  }

  return [
    { ...formatField, width: 2 },
    {
      name: fieldName('damageDiceCount'),
      label: 'Count',
      type: 'text',
      inputType: 'number',
      placeholder: 'e.g. 1',
      group: g,
      width: 1,
    },
    {
      name: fieldName('damageDieFace'),
      label: 'Face',
      type: 'select',
      options: [...DIE_FACE_OPTIONS],
      defaultFromOptions: 'first',
      placeholder: 'Die',
      group: g,
      width: 1,
    },
    {
      name: fieldName('damageModifier'),
      label: 'Modifier',
      type: 'text',
      placeholder: '1',
      helperText: '',
      // helperText: 'Optional; added to the roll (e.g. 2 or -1)',
      group: g,
      width: 1,
    },
    damageTypeField,
  ];
}

function SpellDamagePayloadFieldsBody({
  namePrefix,
  fmt,
  damageTypeOptions,
  patchDriver,
}: {
  namePrefix: string;
  fmt: string;
  damageTypeOptions: { value: string; label: string }[];
  patchDriver: PatchDriver | null;
}): ReactElement {
  const fields = buildSpellDamageFormFields(namePrefix, fmt, damageTypeOptions);
  return (
    <DynamicFormRenderer
      fields={fields}
      spacing={2}
      driver={patchDriver ? { kind: 'patch', ...patchDriver } : undefined}
    />
  );
}

function SpellDamagePayloadFieldsRhf({
  namePrefix,
  damageTypeOptions,
}: {
  namePrefix: string;
  damageTypeOptions: { value: string; label: string }[];
}): ReactElement {
  const fmt =
    (useWatch({ name: `${namePrefix}.damageFormat` }) as string | undefined | null) ?? 'dice';

  return (
    <SpellDamagePayloadFieldsBody
      namePrefix={namePrefix}
      fmt={fmt}
      damageTypeOptions={damageTypeOptions}
      patchDriver={null}
    />
  );
}

function SpellDamagePayloadFieldsPatch({
  namePrefix,
  patchDriver,
  damageTypeOptions,
}: {
  namePrefix: string;
  patchDriver: PatchDriver;
  damageTypeOptions: { value: string; label: string }[];
}): ReactElement {
  const fmt = String(patchDriver.getValue(`${namePrefix}.damageFormat`) ?? 'dice');

  return (
    <SpellDamagePayloadFieldsBody
      namePrefix={namePrefix}
      fmt={fmt}
      damageTypeOptions={damageTypeOptions}
      patchDriver={patchDriver}
    />
  );
}

function PayloadByKind({
  kind,
  namePrefix,
  patchDriver,
}: {
  kind: string;
  namePrefix: string;
  patchDriver: PatchDriver | null;
}) {
  const usePatch = patchDriver != null;

  const conditionOptions = EFFECT_CONDITION_DEFINITIONS.map((d) => ({
    value: d.id,
    label: d.name,
  }));

  const damageTypeOptions = [
    { value: '', label: 'Optional type' },
    ...DAMAGE_TYPE_SELECT_OPTIONS,
  ];

  const rechargeOptions = RESOURCE_RECHARGE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const renderField = (relativeName: string, field: FieldConfig) =>
    usePatch ? (
      <PrefixedDriverField
        key={relativeName}
        namePrefix={namePrefix}
        relativeName={relativeName}
        field={field}
        driver={patchDriver}
      />
    ) : (
      <PrefixedDynamicField key={relativeName} namePrefix={namePrefix} relativeName={relativeName} field={field} />
    );

  switch (kind) {
    case 'note':
      return (
        <Stack spacing={2}>
          {renderField('noteText', {
            name: 'noteText',
            label: 'Note text',
            type: 'textarea',
            rows: 3,
            placeholder: 'Player-facing or GM note',
          })}
        </Stack>
      );
    case 'damage':
      if (usePatch) {
        if (!patchDriver) return null;
        return (
          <SpellDamagePayloadFieldsPatch
            namePrefix={namePrefix}
            patchDriver={patchDriver}
            damageTypeOptions={damageTypeOptions}
          />
        );
      }
      return (
        <SpellDamagePayloadFieldsRhf namePrefix={namePrefix} damageTypeOptions={damageTypeOptions} />
      );
    case 'condition':
      return (
        <Stack spacing={2}>
          {renderField('conditionId', {
            name: 'conditionId',
            label: 'Condition',
            type: 'select',
            options: conditionOptions,
            defaultFromOptions: 'first',
            placeholder: 'Select condition',
          })}
        </Stack>
      );
    case 'move':
      return (
        <Stack spacing={2}>
          {renderField('moveDistance', {
            name: 'moveDistance',
            label: 'Distance (feet)',
            type: 'text',
            inputType: 'number',
            placeholder: 'e.g. 15',
          })}
          {renderField('moveForced', {
            name: 'moveForced',
            label: 'Forced movement',
            type: 'checkbox',
          })}
        </Stack>
      );
    case 'resource':
      return (
        <Stack spacing={2}>
          {renderField('resourceId', {
            name: 'resourceId',
            label: 'Resource id',
            type: 'text',
            placeholder: 'e.g. lay-on-hands-pool',
          })}
          {renderField('resourceMax', {
            name: 'resourceMax',
            label: 'Maximum uses',
            type: 'text',
            inputType: 'number',
            placeholder: 'e.g. 5',
          })}
          {renderField('resourceRecharge', {
            name: 'resourceRecharge',
            label: 'Recharge',
            type: 'select',
            options: rechargeOptions,
            defaultFromOptions: 'first',
          })}
        </Stack>
      );
    case 'grant':
    case 'immunity':
    case 'save':
    case 'check':
    case 'state':
      return (
        <Alert severity="info" variant="outlined">
          {STUB_MSG}
        </Alert>
      );
    default:
      return kind === '' ? null : (
        <Alert severity="warning" variant="outlined">
          Select an effect kind to edit payload fields.
        </Alert>
      );
  }
}

function SpellEffectPayloadFieldsRhf({ namePrefix }: { namePrefix: string }) {
  const kind = (useWatch({ name: `${namePrefix}.kind` }) as string | undefined) ?? '';
  return <PayloadByKind kind={kind} namePrefix={namePrefix} patchDriver={null} />;
}

function SpellEffectPayloadFieldsPatch({
  namePrefix,
  patchDriver,
}: {
  namePrefix: string;
  patchDriver: PatchDriver;
}) {
  const kind = String(patchDriver.getValue(`${namePrefix}.kind`) ?? '');
  return <PayloadByKind kind={kind} namePrefix={namePrefix} patchDriver={patchDriver} />;
}

export type SpellEffectPayloadFieldsProps = {
  namePrefix: string;
  patchDriver: PatchDriver | null;
};

/**
 * Row-scoped payload editor: watches `${namePrefix}.kind` and renders structured fields or stubs.
 * Renders via RHF when `patchDriver` is null, else via patch driver (system spell patch UI).
 */
export function SpellEffectPayloadFields({ namePrefix, patchDriver }: SpellEffectPayloadFieldsProps) {
  if (patchDriver) {
    return <SpellEffectPayloadFieldsPatch namePrefix={namePrefix} patchDriver={patchDriver} />;
  }
  return <SpellEffectPayloadFieldsRhf namePrefix={namePrefix} />;
}
