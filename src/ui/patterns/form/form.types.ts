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
  /** RHF Controller rules (compiled from FieldSpec validation). */
  rules?: RegisterOptions;
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
