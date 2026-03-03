/**
 * Gear form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/forms/registry';
import { GEAR_FORM_FIELDS } from './gearForm.registry';
import type { GearFormValues } from './gearForm.types';

export type GetGearFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for gear Create/Edit forms.
 */
export const getGearFieldConfigs = (
  options: GetGearFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(GEAR_FORM_FIELDS, options);

/**
 * Default values for gear forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const GEAR_FORM_DEFAULTS: GearFormValues = buildDefaultValues<GearFormValues>(
  getGearFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
