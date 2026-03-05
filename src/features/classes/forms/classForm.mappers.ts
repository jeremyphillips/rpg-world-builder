/**
 * Pure mappers for Class form values ↔ domain types.
 * Registry-backed.
 */
import type { CharacterClass } from '@/features/classes/domain/types';
import type { ClassFormValues, ClassInput } from './classForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/forms/registry';
import { CLASS_FORM_FIELDS } from './classForm.registry';

const toInput = buildToInput(CLASS_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(CLASS_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(CLASS_FORM_FIELDS);

/**
 * Converts a CharacterClass domain object to form values.
 */
export const classToFormValues = (charClass: CharacterClass): ClassFormValues => ({
  ...(defaultFormValues as ClassFormValues),
  ...toFormValuesFromItem(charClass as CharacterClass & Record<string, unknown>),
});

/**
 * Converts form values to ClassInput for create/update.
 */
export const toClassInput = (values: ClassFormValues): ClassInput =>
  toInput(values) as ClassInput;
