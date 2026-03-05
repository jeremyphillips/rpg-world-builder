/**
 * Class form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/forms/registry';
import { CLASS_FORM_FIELDS } from './classForm.registry';
import type { ClassFormValues } from './classForm.types';

/**
 * Returns FieldConfig[] for class Create/Edit forms.
 */
export const getClassFieldConfigs = (): FieldConfig[] =>
  buildFieldConfigs(CLASS_FORM_FIELDS);

/**
 * Default values for class forms (RHF defaultValues).
 */
export const CLASS_FORM_DEFAULTS: ClassFormValues = buildDefaultValues<ClassFormValues>(
  getClassFieldConfigs()
);
