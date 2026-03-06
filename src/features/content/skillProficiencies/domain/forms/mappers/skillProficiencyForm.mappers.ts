/**
 * Pure mappers for Skill Proficiency form values ↔ domain types.
 * Registry-backed.
 */
import type { SkillProficiency } from '@/features/content/shared/domain/types';
import type { SkillProficiencyInput } from '../types/skillProficiencyForm.types';
import type { SkillProficiencyFormValues } from '../types/skillProficiencyForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { SKILL_PROFICIENCY_FORM_FIELDS } from '../registry/skillProficiencyForm.registry';

const toInput = buildToInput(SKILL_PROFICIENCY_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(SKILL_PROFICIENCY_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(SKILL_PROFICIENCY_FORM_FIELDS);

/**
 * Converts a SkillProficiency domain object to form values.
 */
export const skillProficiencyToFormValues = (
  item: SkillProficiency,
): SkillProficiencyFormValues => ({
  ...(defaultFormValues as SkillProficiencyFormValues),
  ...toFormValuesFromItem(item as SkillProficiency & Record<string, unknown>),
});

/**
 * Converts form values to SkillProficiencyInput for create/update.
 * Spec-driven — SKILL_PROFICIENCY_FORM_FIELDS parse rules are the source of truth.
 */
export const toSkillProficiencyInput = (
  values: SkillProficiencyFormValues,
): SkillProficiencyInput => toInput(values) as SkillProficiencyInput;
