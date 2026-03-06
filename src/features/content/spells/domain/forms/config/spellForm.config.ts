/**
 * Spell form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { SPELL_FORM_FIELDS } from '../registry/spellForm.registry';
import type { SpellFormValues } from '../types/spellForm.types';

export type GetSpellFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for spell Create/Edit forms.
 */
export const getSpellFieldConfigs = (
  options: GetSpellFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(SPELL_FORM_FIELDS, options);

/**
 * Default values for spell forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const SPELL_FORM_DEFAULTS: SpellFormValues = buildDefaultValues<SpellFormValues>(
  getSpellFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
