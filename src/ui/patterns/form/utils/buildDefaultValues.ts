/**
 * Builds RHF defaultValues from FieldConfig[].
 * Uses field.defaultValue, or field.defaultFromOptions === 'first' for option-based fields.
 */
import type { FieldConfig } from '../form.types';

export function buildDefaultValues<T extends Record<string, unknown>>(
  fields: FieldConfig[],
  overrides?: Partial<T>,
): T {
  const out: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === 'hidden') continue;

    if (field.type === 'optionPicker') {
      if (field.defaultValue !== undefined) {
        out[field.name] = field.defaultValue;
      } else {
        const mode = field.valueMode ?? 'array';
        out[field.name] = mode === 'scalar' ? '' : [];
      }
      continue;
    }

    if (field.defaultValue !== undefined) {
      out[field.name] = field.defaultValue;
      continue;
    }

    if (field.defaultFromOptions === 'first' && 'options' in field && field.options?.length) {
      out[field.name] = field.options[0].value;
      continue;
    }
  }

  return { ...out, ...(overrides ?? {}) } as T;
}
