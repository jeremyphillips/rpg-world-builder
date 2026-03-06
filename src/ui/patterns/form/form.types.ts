import type { RegisterOptions } from 'react-hook-form';
import type { Condition } from './conditions';

export type SelectOption = {
  label: string
  value: string
}

type BaseFieldConfig = {
  name: string
  label: string
  required?: boolean
  disabled?: boolean
  /** Optional section id to group fields into tabs via TabbedFormLayout */
  section?: string
  /** Helper text shown below the field */
  helperText?: string
  /** UI-only description shown below the field (separate from helperText/validation) */
  fieldDescription?: React.ReactNode
  /** Default value for initial form state / RHF defaultValues */
  defaultValue?: unknown
  /** For option-based fields: use first option's value as default */
  defaultFromOptions?: 'first';
  /** When set, field is shown only when condition evaluates to true */
  visibleWhen?: Condition;
  /** For patch driver: dot-path into domain object. When omitted, uses name. */
  path?: string;
  /**
   * For patch driver: custom binding when UI field shape differs from domain path.
   * Adapts flattened/custom UI fields to domain-shaped patch values.
   * When present, used instead of direct path lookup.
   */
  patchBinding?: {
    domainPath: string;
    parse: (domainValue: unknown) => unknown;
    serialize: (uiValue: unknown, currentDomainValue: unknown) => unknown;
  };
  /** RHF Controller rules (compiled from FieldSpec validation). */
  rules?: RegisterOptions;
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
}

export type FormSection = {
  id: string
  label: string
}

export type FieldConfig =
  | BaseFieldConfig & {
      type: 'text';
      multiline?: boolean;
      rows?: number;
      placeholder?: string;
      inputType?: 'text' | 'email' | 'password' | 'number';
    }
  | BaseFieldConfig & {
      type: 'textarea'
      rows?: number
      placeholder?: string
    }
  | BaseFieldConfig & {
      type: 'select'
      options: SelectOption[]
      placeholder?: string
    }
  | BaseFieldConfig & {
      type: 'radio'
      options: SelectOption[]
      row?: boolean
    }
  | BaseFieldConfig & {
      type: 'checkbox'
    }
  | BaseFieldConfig & {
      type: 'checkboxGroup'
      options: SelectOption[]
      row?: boolean
    }
  | BaseFieldConfig & {
      type: 'imageUpload'
      maxHeight?: number
    }
  | BaseFieldConfig & {
      type: 'datetime'
    }
  | BaseFieldConfig & {
      type: 'visibility'
      characters?: { id: string; name: string }[]
      allowHidden?: boolean
    }
  | BaseFieldConfig & {
      type: 'json'
      path?: string
      placeholder?: string
      minRows?: number
      maxRows?: number
    }
  | Omit<BaseFieldConfig, 'label'> & {
      type: 'hidden'
      label?: string
    }
