/**
 * Race form field registry — single source of truth for config + mapping.
 * Race has only base content fields (name, description, imageKey, accessPolicy).
 */
import type { Race, RaceInput } from '@/features/content/shared/domain/types';
import { getBaseContentFieldSpecs } from '@/features/content/shared/forms/baseFieldSpecs';
import type { FieldSpec } from '@/features/content/shared/forms/registry';
import type { RaceFormValues } from '../types/raceForm.types';

export const RACE_FORM_FIELDS = [
  ...getBaseContentFieldSpecs<
    RaceFormValues,
    RaceInput & Record<string, unknown>,
    Race & Record<string, unknown>
  >(),
] as const satisfies readonly FieldSpec<
  RaceFormValues,
  RaceInput & Record<string, unknown>,
  Race & Record<string, unknown>
>[];
