/**
 * Class form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 *
 * Uses `buildFormLayout` so structured groups (`definitions`) render alongside legacy JSON fields.
 */
import type { FormLayoutNode } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFormLayout } from '@/features/content/shared/forms/registry';
import { getClassFormFields } from '../registry/classForm.registry';
import type { ClassFormValues } from '../types/classForm.types';

export type GetClassFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FormLayoutNode[] for class Create/Edit forms.
 */
export const getClassFieldConfigs = (
  options: GetClassFieldConfigsOptions = {}
): FormLayoutNode[] => buildFormLayout(getClassFormFields(), options);

/**
 * Default values for class forms (RHF defaultValues).
 */
export const CLASS_FORM_DEFAULTS: ClassFormValues = buildDefaultValues<ClassFormValues>(
  getClassFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC }
);
