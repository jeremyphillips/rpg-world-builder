/**
 * Converts FieldSpec[] -> FieldConfig[] for AppForm.
 */
import type { RegisterOptions } from 'react-hook-form';
import type { FieldConfig } from '@/ui/patterns';
import type { ValidationRule, ValidationSpec } from '@/ui/patterns';
import type { FieldSpec } from './fieldSpec.types';

export type BuildFieldConfigsOptions = {
  policyCharacters?: { id: string; name: string }[];
};

function applyRule(rule: ValidationRule, n: number): string | null {
  switch (rule.kind) {
    case 'min':
      return n < rule.value ? (rule.message ?? `Must be at least ${rule.value}`) : null;
    case 'max':
      return n > rule.value ? (rule.message ?? `Must be at most ${rule.value}`) : null;
    case 'integer':
      return !Number.isInteger(n) ? (rule.message ?? 'Must be a whole number') : null;
    case 'pattern':
    case 'minLength':
    case 'maxLength':
      return null; // not applicable to numberText
    default:
      return null;
  }
}

function compileNumberTextRules(
  label: string,
  required: boolean | undefined,
  validation: ValidationSpec | undefined,
): RegisterOptions {
  const validate = (value: unknown): true | string => {
    const empty = value === '' || value == null || (typeof value === 'string' && value.trim() === '');
    if (empty) {
      return required ? `${label} is required` : true;
    }
    const n = Number(value);
    if (Number.isNaN(n)) {
      return `${label} must be a number`;
    }

    if (validation?.rules) {
      for (const rule of validation.rules) {
        const err = applyRule(rule, n);
        if (err) return err;
      }
    }
    return true;
  };
  return {
    required: required ? `${label} is required` : false,
    validate,
  };
}

/**
 * Builds FieldConfig[] from FieldSpec[], skipping specs with skipInForm.
 */
export const buildFieldConfigs = <
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
>(
  specs: readonly FieldSpec<FormValues, InputShape, ItemShape>[],
  options: BuildFieldConfigsOptions = {}
): FieldConfig[] => {
  const { policyCharacters = [] } = options;

  const configs: FieldConfig[] = [];

  for (const spec of specs) {
    if (spec.skipInForm) continue;

    const base = {
      name: spec.name,
      label: spec.label,
      required: spec.required,
      placeholder: spec.placeholder,
      helperText: spec.helperText,
      ...(spec.defaultValue !== undefined && { defaultValue: spec.defaultValue }),
      ...(spec.defaultFromOptions && { defaultFromOptions: spec.defaultFromOptions }),
      ...(spec.visibleWhen && { visibleWhen: spec.visibleWhen }),
    };

    switch (spec.kind) {
      case 'text':
        configs.push({ ...base, type: 'text' });
        break;
      case 'textarea':
        configs.push({
          ...base,
          type: 'textarea',
          rows: 4,
        });
        break;
      case 'select':
        configs.push({
          ...base,
          type: 'select',
          options: spec.options
            ? spec.options.map((o) => ({ value: o.value, label: o.label }))
            : [],
        });
        break;
      case 'checkbox':
        configs.push({ ...base, type: 'checkbox' });
        break;
      case 'numberText': {
        const rules = spec.validation
          ? compileNumberTextRules(spec.label, spec.required, spec.validation)
          : (spec.required ? { required: `${spec.label} is required` } : {});
        configs.push({
          ...base,
          type: 'text',
          inputType: 'number',
          ...(Object.keys(rules).length > 0 && { rules }),
        });
        break;
      }
      case 'imageUpload':
        configs.push({
          ...base,
          type: 'imageUpload',
          helperText: spec.helperText ?? '/assets/... or CDN key',
        });
        break;
      case 'visibility':
        configs.push({
          ...base,
          type: 'visibility',
          characters: policyCharacters,
          allowHidden: false,
        });
        break;
      case 'json':
        configs.push({
          ...base,
          type: 'json',
          placeholder: spec.placeholder,
          minRows: spec.minRows ?? 4,
          maxRows: spec.maxRows ?? 16,
        });
        break;
      default:
        break;
    }
  }

  return configs;
};
