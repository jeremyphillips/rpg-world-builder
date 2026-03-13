/**
 * Patch-mode field validation: reuses FieldConfig rules (required + validate).
 */
import type { FieldConfig } from '../form.types';

export type PatchFieldErrors = Record<string, string | undefined>;

function isValueMissing(field: FieldConfig, value: unknown): boolean {
  if (value == null) return true;
  if (field.type === 'text' || field.type === 'textarea') {
    return typeof value === 'string' && value.trim() === '';
  }
  if (field.type === 'checkbox') {
    return value !== true;
  }
  if (field.type === 'checkboxGroup') {
    return !Array.isArray(value) || value.length === 0;
  }
  return false;
}

function runValidate(
  validate: (...args: any[]) => unknown,
  value: unknown,
): string | undefined {
  const result = validate(value);
  if (result === true) return undefined;
  if (result instanceof Promise) return undefined;
  if (result === false) return 'Invalid value';
  if (Array.isArray(result)) {
    return result.map(String).join(', ') || 'Invalid value';
  }
  return typeof result === 'string' ? result : undefined;
}

function runValidateObject(
  validateObj: Record<string, (...args: any[]) => unknown>,
  value: unknown,
): string | undefined {
  for (const key of Object.keys(validateObj)) {
    const err = runValidate(validateObj[key], value);
    if (err) return err;
  }
  return undefined;
}

export function validatePatchField(params: {
  field: FieldConfig;
  value: unknown;
}): string | undefined {
  const { field, value } = params;

  if (field.required && isValueMissing(field, value)) {
    return `${field.label} is required`;
  }

  const rules = field.rules;
  if (!rules?.validate) return undefined;

  const validate = rules.validate;
  if (typeof validate === 'function') {
    return runValidate(validate, value);
  }
  if (typeof validate === 'object' && validate !== null) {
    return runValidateObject(
      validate as Record<string, (...args: any[]) => unknown>,
      value,
    );
  }
  return undefined;
}
