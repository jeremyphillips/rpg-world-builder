/**
 * Transitional helper for `kind: 'json'` field specs.
 *
 * @deprecated This factory is a stop-gap during the migration from JSON textareas
 * to structured form groups. New fields should be expressed via `RepeatableGroupSpec`
 * or composite `FieldSpec` trees instead. Greppable via the import to track
 * "what's left to migrate" — when no slice imports it, delete in Phase 8.
 */
import type { FieldSpec } from './fieldSpec.types';
import { formatJson, parseJson } from '../parsers';

export type CreateJsonFieldSpecOptions<
  FormValues extends Record<string, unknown>,
  // Phantom type params kept aligned with `FieldSpec` for ergonomic call-site inference.
  _InputShape extends Record<string, unknown>,
  _ItemShape extends Record<string, unknown>,
  K extends keyof FormValues & string,
> = {
  name: K;
  label: string;
  /** Textarea placeholder (often a JSON example). */
  placeholder: string;
  /** Minimum textarea rows. Defaults to 2. */
  minRows?: number;
  /** Maximum textarea rows. Defaults to 8. */
  maxRows?: number;
  /**
   * Optional dot-path prefix for system patch mode (e.g. `'mechanics'` produces
   * `mechanics.<name>`). When omitted the field's `path` is left unset (RHF
   * resolves it via the field name).
   */
  patchPathPrefix?: string;
  /**
   * Override the JSON parser. Defaults to {@link parseJson}, which accepts any
   * JSON value (objects, arrays, primitives). Slices that need object-only
   * semantics can pass `parseJsonObject` here instead.
   */
  parse?: (v: unknown) => unknown;
  /**
   * Override the JSON formatter. Defaults to {@link formatJson}, which returns
   * `''` for nullish input. Pass `formatJsonObject` to default to `'{}'` instead.
   */
  format?: (v: unknown) => string;
  /** Override the default form value. Defaults to `''`. */
  defaultValue?: FormValues[K];
  /** Optional helper text under the textarea. */
  helperText?: string;
  /** Optional display formatter for detail views. */
  formatForDisplay?: (v: unknown) => React.ReactNode;
};

/**
 * Build a `kind: 'json'` {@link FieldSpec} with shared parse/format defaults.
 *
 * Replaces the per-slice private `jsonField()` factories that previously lived in
 * `monsterForm.registry.ts` and `classForm.registry.ts`. Centralizing the helper
 * lets us see remaining JSON fields at a glance via the import call sites.
 *
 * @deprecated See file-level docblock — migrate fields off this helper as part
 * of the structured-groups rollout.
 */
export function createJsonFieldSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
  K extends keyof FormValues & string = keyof FormValues & string,
>(
  options: CreateJsonFieldSpecOptions<FormValues, InputShape, ItemShape, K>,
): FieldSpec<FormValues, InputShape, ItemShape> {
  const {
    name,
    label,
    placeholder,
    minRows = 2,
    maxRows = 8,
    patchPathPrefix,
    parse = parseJson,
    format = formatJson,
    defaultValue,
    helperText,
    formatForDisplay,
  } = options;

  const spec: FieldSpec<FormValues, InputShape, ItemShape> = {
    name,
    label,
    kind: 'json',
    placeholder,
    minRows,
    maxRows,
    defaultValue: (defaultValue ?? ('' as FormValues[K])) as FormValues[keyof FormValues],
    parse: (v) => parse(v),
    format: (v) => format(v) as FormValues[keyof FormValues],
  };

  if (patchPathPrefix !== undefined) {
    spec.path = `${patchPathPrefix}.${name}`;
  }
  if (helperText !== undefined) {
    spec.helperText = helperText;
  }
  if (formatForDisplay !== undefined) {
    spec.formatForDisplay = formatForDisplay;
  }

  return spec;
}
