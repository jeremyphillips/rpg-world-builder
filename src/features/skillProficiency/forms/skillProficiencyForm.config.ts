/**
 * Skill Proficiency form field configs for AppForm + DynamicFormRenderer.
 * Registry-backed.
 */
import type { FieldConfig } from '@/ui/patterns'
import { buildFieldConfigs, buildDefaultFormValues } from '@/features/content/forms/registry'
import { SKILL_PROFICIENCY_FORM_FIELDS } from './skillProficiencyForm.registry'
import type { SkillProficiencyFormValues } from './skillProficiencyForm.types'

export type GetSkillProficiencyFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
}

/**
 * Returns FieldConfig[] for skill proficiency Create/Edit forms.
 */
export const getSkillProficiencyFieldConfigs = (
  options: GetSkillProficiencyFieldConfigsOptions = {}
): FieldConfig[] => buildFieldConfigs(SKILL_PROFICIENCY_FORM_FIELDS, options)

/**
 * Default values for skill proficiency forms (RHF defaultValues).
 */
export const SKILL_PROFICIENCY_FORM_DEFAULTS: SkillProficiencyFormValues =
  buildDefaultFormValues(SKILL_PROFICIENCY_FORM_FIELDS) as SkillProficiencyFormValues
