/**
 * Pure mappers for Armor form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Armor, ArmorInput } from '@/features/content/shared/domain/types';
import type { ArmorFormValues } from '../types/armorForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { ARMOR_FORM_FIELDS } from '../registry/armorForm.registry';

const toInput = buildToInput(ARMOR_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(ARMOR_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(ARMOR_FORM_FIELDS);

/**
 * Converts an Armor domain object to form values.
 */
export const armorToFormValues = (armor: Armor): ArmorFormValues => ({
  ...(defaultFormValues as ArmorFormValues),
  ...toFormValuesFromItem(armor as Armor & Record<string, unknown>),
  accessPolicy: (armor.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as ArmorFormValues['accessPolicy'],
});

/**
 * Converts form values to ArmorInput for create/update.
 * Fully spec-driven — ARMOR_FORM_FIELDS parse rules are the source of truth.
 */
export const toArmorInput = (values: ArmorFormValues): ArmorInput =>
  toInput(values) as ArmorInput;
