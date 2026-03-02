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
}

export type FormSection = {
  id: string
  label: string
}

export type FieldConfig =
  | BaseFieldConfig & {
      type: 'text'
      multiline?: boolean
      rows?: number
      placeholder?: string
      inputType?: 'text' | 'email' | 'password' | 'number'
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
  | Omit<BaseFieldConfig, 'label'> & {
      type: 'hidden'
      label?: string
    }
