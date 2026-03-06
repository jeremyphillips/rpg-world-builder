/**
 * Armor form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { ARMOR_FORM_FIELDS } from '../registry/armorForm.registry';
import type { ArmorFormValues } from '../types/armorForm.types';

export type GetArmorFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for armor Create/Edit forms.
 */
export const getArmorFieldConfigs = (
  options: GetArmorFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(ARMOR_FORM_FIELDS, options);

/**
 * Default values for armor forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const ARMOR_FORM_DEFAULTS: ArmorFormValues = buildDefaultValues<ArmorFormValues>(
  getArmorFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
