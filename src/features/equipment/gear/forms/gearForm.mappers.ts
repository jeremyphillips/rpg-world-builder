/**
 * Pure mappers for Gear form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Gear, GearInput } from '@/features/content/domain/types';
import type { GearFormValues } from './gearForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/forms/registry';
import { GEAR_FORM_FIELDS } from './gearForm.registry';

const toInput = buildToInput(GEAR_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(GEAR_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(GEAR_FORM_FIELDS);

/**
 * Converts a Gear domain object to form values.
 */
export const gearToFormValues = (gear: Gear): GearFormValues => ({
  ...(defaultFormValues as GearFormValues),
  ...toFormValuesFromItem(gear as Gear & Record<string, unknown>),
  accessPolicy: (gear.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as GearFormValues['accessPolicy'],
});

/**
 * Converts form values to GearInput for create/update.
 * Fully spec-driven — GEAR_FORM_FIELDS parse rules are the source of truth.
 */
export const toGearInput = (values: GearFormValues): GearInput =>
  toInput(values) as GearInput;
