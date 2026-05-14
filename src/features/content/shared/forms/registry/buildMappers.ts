/**
 * Generates toInput, toFormValues, and defaultFormValues from FieldSpec[].
 */
import type { FieldSpec } from './fieldSpec.types';
import type { FormNodeSpec } from './formNodeSpec.types';
import { isCustomFormNodeSpec, isRepeatableGroupSpec } from './formNodeSpec.types';

/**
 * Builds default form values from specs (for initial state / fallbacks).
 */
export const buildDefaultFormValues = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  specs: readonly FieldSpec<FormValues, InputShape, ItemShape>[]
): Partial<FormValues> => {
  const out: Record<string, unknown> = {};
  for (const spec of specs) {
    if (spec.defaultValue !== undefined) {
      out[spec.name] = spec.defaultValue;
    }
  }
  return out as Partial<FormValues>;
};

/**
 * Default values for a FormNodeSpec tree (repeatable groups default to `[]`).
 */
export const buildDefaultFormValuesFromFormNodes = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  specs: readonly FormNodeSpec<FormValues, InputShape, ItemShape>[],
): Partial<FormValues> => {
  const out: Record<string, unknown> = {};
  for (const spec of specs) {
    if (isCustomFormNodeSpec(spec)) {
      continue;
    }
    if (isRepeatableGroupSpec(spec)) {
      out[spec.name] = [];
      continue;
    }
    if (spec.defaultValue !== undefined) {
      out[spec.name] = spec.defaultValue;
    }
  }
  return out as Partial<FormValues>;
};

/**
 * Builds a function that maps form values -> partial input, using each spec's parse.
 */
export const buildToInput = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  specs: readonly FieldSpec<FormValues, InputShape, ItemShape>[]
): ((values: FormValues) => Partial<InputShape>) => {
  return (values: FormValues): Partial<InputShape> => {
    const out: Record<string, unknown> = {};
    for (const spec of specs) {
      if (!spec.parse) continue;
      const formVal = values[spec.name];
      const inputVal = spec.parse(formVal);
      if (inputVal === undefined) continue;
      out[spec.name] = inputVal;
    }
    return out as Partial<InputShape>;
  };
};

/**
 * Builds a function that maps item -> partial form values, using each spec's format.
 */
export const buildToFormValues = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown>,
  ItemShape extends Record<string, unknown>,
>(
  specs: readonly FieldSpec<FormValues, InputShape, ItemShape>[]
): ((item: ItemShape) => Partial<FormValues>) => {
  return (item: ItemShape): Partial<FormValues> => {
    const out: Record<string, unknown> = {};
    for (const spec of specs) {
      if (!spec.format) continue;
      const itemVal = (item as Record<string, unknown>)[spec.name];
      out[spec.name] = spec.format(itemVal);
    }
    return out as Partial<FormValues>;
  };
};
