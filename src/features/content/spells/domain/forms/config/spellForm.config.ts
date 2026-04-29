/**
 * Spell form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FormLayoutNode } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFormLayout } from '@/features/content/shared/forms/registry';
import type { CharacterClass } from '@/features/content/classes/domain/types';
import { getSpellFormFields } from '../registry/spellForm.registry';
import type { SpellFormValues } from '../types/spellForm.types';

export type GetSpellFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
  /** Campaign catalog `classesById` — merged system + campaign, policy-filtered. */
  classesById?: Record<string, CharacterClass> | undefined;
};

/**
 * Returns FormLayoutNode[] for spell Create/Edit forms.
 */
export const getSpellFieldConfigs = (
  options: GetSpellFieldConfigsOptions = {}
): FormLayoutNode[] => {
  const { policyCharacters = [], classesById } = options;
  return buildFormLayout(getSpellFormFields({ classesById }), { policyCharacters });
};

/**
 * Default values for spell forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const SPELL_FORM_DEFAULTS: SpellFormValues = buildDefaultValues<SpellFormValues>(
  getSpellFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
