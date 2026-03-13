/**
 * Monster form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { MONSTER_FORM_FIELDS } from '../registry/monsterForm.registry';
import type { MonsterFormValues } from '../types/monsterForm.types';

export type GetMonsterFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for monster Create/Edit forms.
 */
export const getMonsterFieldConfigs = (
  options: GetMonsterFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(MONSTER_FORM_FIELDS, options);

/**
 * Default values for monster forms (RHF defaultValues).
 */
export const MONSTER_FORM_DEFAULTS: MonsterFormValues = buildDefaultValues<MonsterFormValues>(
  getMonsterFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
