/**
 * Pure mappers for Race form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import { DEFAULT_VISIBILITY_PUBLIC } from '@/ui/patterns';
import type { Race, RaceInput } from '@/features/content/races/domain/types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { RACE_FORM_FIELDS } from '../registry/raceForm.registry';
import type { RaceFormValues } from '../types/raceForm.types';

const toInput = buildToInput(RACE_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(RACE_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(RACE_FORM_FIELDS);

/**
 * Converts a Race domain object to form values.
 */
export const raceToFormValues = (race: Race): RaceFormValues => ({
  ...(defaultFormValues as RaceFormValues),
  ...toFormValuesFromItem(race as Race & Record<string, unknown>),
  accessPolicy: (race.accessPolicy ?? DEFAULT_VISIBILITY_PUBLIC) as RaceFormValues['accessPolicy'],
});

/**
 * Converts form values to RaceInput for create/update.
 * Fully spec-driven — RACE_FORM_FIELDS parse rules are the source of truth.
 */
export const toRaceInput = (values: RaceFormValues): RaceInput =>
  toInput(values) as RaceInput;
