/**
 * Race form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns';
import { buildDefaultValues, DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import { buildFieldConfigs } from '@/features/content/shared/forms/registry';
import { RACE_FORM_FIELDS } from '../registry/raceForm.registry';
import type { RaceFormValues } from '../types/raceForm.types';

export type GetRaceFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

/**
 * Returns FieldConfig[] for race Create/Edit forms.
 */
export const getRaceFieldConfigs = (
  options: GetRaceFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(RACE_FORM_FIELDS, options);

/**
 * Default values for race forms (RHF defaultValues).
 * Derived from field configs with overrides for accessPolicy.
 */
export const RACE_FORM_DEFAULTS: RaceFormValues = buildDefaultValues<RaceFormValues>(
  getRaceFieldConfigs(),
  { accessPolicy: DEFAULT_VISIBILITY_PUBLIC },
);
