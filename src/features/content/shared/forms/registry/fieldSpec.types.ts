import type { Condition, ValidationSpec } from '@/ui/patterns';

export type { ValidationRule, ValidationSpec } from '@/ui/patterns';

/**
 * FieldSpec — single source of truth for form field config + mapping.
 *
 * Supports: text, textarea, select, checkbox, numberText, imageUpload, visibility.
 */
export type FieldSpecKind =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'checkboxGroup'
  | 'numberText'
  | 'imageUpload'
  | 'visibility'
  | 'json';

export type FieldSpecOption = { value: string; label: string };

export type FieldSpec<
  FormValues extends Record<string, unknown>,
  InputShape extends Record<string, unknown> = Record<string, unknown>,
  ItemShape extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: keyof FormValues & string;
  label: string;
  kind: FieldSpecKind;
  options?: readonly FieldSpecOption[];
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  /** When true, field is used for mapping only (e.g. rendered by layout). */
  skipInForm?: boolean;
  /** Form value -> input value. Empty string -> undefined for optional fields. */
  parse?: (formValue: FormValues[keyof FormValues]) => unknown;
  /** Item value -> form value. */
  format?: (itemValue: unknown) => FormValues[keyof FormValues];
  /** Item value -> display value (ReactNode). Used for detail view. */
  formatForDisplay?: (itemValue: unknown) => React.ReactNode;
  /** Default for initial form state. */
  defaultValue?: FormValues[keyof FormValues];
  /** For option-based fields (select, radio, checkboxGroup): use first option as default */
  defaultFromOptions?: 'first';
  /** For kind: 'json' — min rows for textarea. */
  minRows?: number;
  /** For kind: 'json' — max rows for textarea. */
  maxRows?: number;
  /** When set, field is shown only when condition evaluates to true. */
  visibleWhen?: Condition;
  /** For patch driver: dot-path into domain object (e.g. damage.default). When omitted, uses name. */
  path?: string;
  /**
   * For patch driver: custom binding when UI field shape differs from domain path.
   * Adapts flattened/custom UI fields (e.g. damageDefaultCount/die) to domain-shaped values (e.g. damage.default).
   */
  patchBinding?: {
    domainPath: string;
    parse: (domainValue: unknown) => unknown;
    serialize: (uiValue: unknown, currentDomainValue: unknown) => unknown;
  };
  /** Validation for kind: 'numberText' (and future field kinds). */
  validation?: ValidationSpec;
  /** UI-only description shown below the field (separate from helperText/validation). */
  fieldDescription?: React.ReactNode;
  /** Optional grouping for row/column layout. Consecutive fields with same group.id render together. */
  group?: {
    id: string;
    label?: string;
    helperText?: string;
    direction?: 'row' | 'column';
    spacing?: number;
  };
  /** MUI Grid xs (1–12). When omitted in a group, uses equal auto-width. */
  width?: number;
};
