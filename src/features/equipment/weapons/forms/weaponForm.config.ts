/**
 * Weapon form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/forms/registry';
import { WEAPON_FORM_FIELDS } from './weaponForm.registry';
import type { WeaponFormValues } from './weaponForm.types';

export type GetWeaponFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for weapon Create/Edit forms.
 */
export const getWeaponFieldConfigs = (
  options: GetWeaponFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(WEAPON_FORM_FIELDS, options);

/**
 * Default values for weapon forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const WEAPON_FORM_DEFAULTS: WeaponFormValues = buildDefaultValues<WeaponFormValues>(
  getWeaponFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
