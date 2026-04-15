/**
 * Pure mappers for Spell form values ↔ domain types.
 * Simple fields: registry parse/format; nested: assembly helpers.
 */
import type { Spell, SpellInput } from '@/features/content/spells/domain/types';
import type { SpellFormValues } from '../types/spellForm.types';
import { buildDefaultValues } from '@/ui/patterns';
import {
  buildFormLayout,
  buildToInput,
  buildToFormValues,
} from '@/features/content/shared/forms/registry';
import {
  getSpellFormFields,
  getSpellSimpleFieldSpecs,
  type SpellFormFieldsOptions,
} from '../registry/spellForm.registry';
import { assembleSpellNestedFields, splitSpellNestedToForm } from '../assembly/spellPayload.assembly';

export type SpellFormMapperOptions = SpellFormFieldsOptions;

export function spellToFormValues(
  spell: Spell,
  options?: SpellFormMapperOptions,
): SpellFormValues {
  const formNodes = getSpellFormFields(options);
  const defaultFormValues = buildDefaultValues<SpellFormValues>(buildFormLayout(formNodes, {}));
  const simpleFromItem = buildToFormValues(getSpellSimpleFieldSpecs(options))(
    spell as Spell & Record<string, unknown>,
  );
  const nestedFromSpell = splitSpellNestedToForm({
    description: spell.description,
    castingTime: spell.castingTime,
    duration: spell.duration,
    range: spell.range,
    components: spell.components,
  });
  return {
    ...(defaultFormValues as SpellFormValues),
    ...simpleFromItem,
    ...nestedFromSpell,
  };
}

export function toSpellInput(
  values: SpellFormValues,
  options?: SpellFormMapperOptions,
): SpellInput {
  const simple = buildToInput(getSpellSimpleFieldSpecs(options))(values);
  const nested = assembleSpellNestedFields(values);
  return { ...simple, ...nested } as SpellInput;
}
