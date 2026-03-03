/**
 * Magic Item form field configs for AppForm + ConditionalFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/forms/registry';
import { MAGIC_ITEM_FORM_FIELDS } from './magicItemForm.registry';
import type { MagicItemFormValues } from './magicItemForm.types';

export type GetMagicItemFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for magic item Create/Edit forms.
 */
export const getMagicItemFieldConfigs = (
  options: GetMagicItemFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(MAGIC_ITEM_FORM_FIELDS, options);

/**
 * Default values for magic item forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const MAGIC_ITEM_FORM_DEFAULTS: MagicItemFormValues =
  buildDefaultValues<MagicItemFormValues>(
    getMagicItemFieldConfigs(),
    { accessPolicy: DEFAULT_VISIBILITY_PUBLIC }
  );
