/**
 * Pure mappers for Class form values ↔ domain types.
 * Registry-backed.
 */
import type { CharacterClass } from '@/features/classes/domain/types';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { ClassFormValues, ClassInput } from '../types/classForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { CLASS_FORM_FIELDS } from '../registry/classForm.registry';

const toInput = buildToInput(CLASS_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(CLASS_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(CLASS_FORM_FIELDS);

/**
 * Converts a CharacterClass domain object to form values.
 */
export const classToFormValues = (
  charClass: CharacterClass & { accessPolicy?: ClassFormValues['accessPolicy'] }
): ClassFormValues => ({
  ...(defaultFormValues as ClassFormValues),
  ...toFormValuesFromItem(charClass as CharacterClass & Record<string, unknown>),
  accessPolicy: (charClass.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as ClassFormValues['accessPolicy'],
});

/**
 * Converts form values to ClassInput for create/update.
 */
export const toClassInput = (values: ClassFormValues): ClassInput =>
  toInput(values) as ClassInput;
