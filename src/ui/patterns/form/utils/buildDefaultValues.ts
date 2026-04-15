/**
 * Builds RHF defaultValues from FieldConfig[] / FormLayoutNode[].
 * Uses field.defaultValue, or field.defaultFromOptions === 'first' for option-based fields.
 */
import type { FieldConfig, FormLayoutNode } from '../form.types';

function isRepeatableGroup(
  n: FormLayoutNode,
): n is Extract<FormLayoutNode, { type: 'repeatable-group' }> {
  return 'type' in n && n.type === 'repeatable-group';
}

export function buildDefaultValues<T extends Record<string, unknown>>(
  fields: FormLayoutNode[],
  overrides?: Partial<T>,
): T {
  const out: Record<string, unknown> = {};

  for (const field of fields) {
    if (isRepeatableGroup(field)) {
      out[field.name] = [];
      continue;
    }
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
