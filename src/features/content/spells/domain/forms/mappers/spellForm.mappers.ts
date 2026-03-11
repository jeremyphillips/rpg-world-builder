/**
 * Pure mappers for Spell form values ↔ domain types.
 * Registry-backed with required-field merging.
 */
import type { Spell, SpellInput } from '@/features/content/spells/domain/types';
import type { SpellFormValues } from '../types/spellForm.types';
import {
  buildToInput,
  buildToFormValues,
  buildDefaultFormValues,
} from '@/features/content/shared/forms/registry';
import { SPELL_FORM_FIELDS } from '../registry/spellForm.registry';

const toInput = buildToInput(SPELL_FORM_FIELDS);
const toFormValuesFromItem = buildToFormValues(SPELL_FORM_FIELDS);
const defaultFormValues = buildDefaultFormValues(SPELL_FORM_FIELDS);

/**
 * Converts a Spell domain object to form values.
 */
export const spellToFormValues = (spell: Spell): SpellFormValues => ({
  ...(defaultFormValues as SpellFormValues),
  ...toFormValuesFromItem(spell as Spell & Record<string, unknown>),
});

/**
 * Converts form values to SpellInput for create/update.
 * Fully spec-driven — SPELL_FORM_FIELDS parse rules are the source of truth.
 */
export const toSpellInput = (values: SpellFormValues): SpellInput =>
  toInput(values) as SpellInput;
