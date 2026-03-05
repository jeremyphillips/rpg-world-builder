/**
 * Class form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/forms/registry';
import { CLASS_FORM_FIELDS } from './classForm.registry';
import type { ClassFormValues } from './classForm.types';

export type GetClassFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for class Create/Edit forms.
 */
export const getClassFieldConfigs = (
  options: GetClassFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(CLASS_FORM_FIELDS, options);

/**
 * Default values for class forms (RHF defaultValues).
 */
export const CLASS_FORM_DEFAULTS: ClassFormValues = buildDefaultValues<ClassFormValues>(
  getClassFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC }
);
