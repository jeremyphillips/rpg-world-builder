/**
 * Weapon form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs, buildDefaultFormValues } from '@/features/content/forms/registry';
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
 * Built from specs so all defaults (including damageDefaultCount, damageDefaultDie) populate.
 */
export const WEAPON_FORM_DEFAULTS: WeaponFormValues = {
  ...buildDefaultFormValues(WEAPON_FORM_FIELDS),
  accessPolicy: DEFAULT_VISIBILITY_PUBLIC,
} as WeaponFormValues;
