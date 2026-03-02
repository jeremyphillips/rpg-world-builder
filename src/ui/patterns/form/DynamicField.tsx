import { useFormContext } from 'react-hook-form'
import type { FieldConfig } from './form.types'
import FormTextField from './FormTextField'
import FormSelectField from './FormSelectField'
import FormRadioField from './FormRadioField'
import FormCheckboxField from './FormCheckboxField'
import FormImageUploadField from './FormImageUploadField'
import FormDateTimeField from './FormDateTimeField'
import FormVisibilityField from './FormVisibilityField'
import FormJsonField from './FormJsonField'

type DynamicFieldProps = {
  field: FieldConfig
}

export default function DynamicField({ field }: DynamicFieldProps) {
  const { register } = useFormContext()

  switch (field.type) {
    case 'text':
      return (
        <FormTextField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
          type={field.inputType}
          rules={field.rules}
        />
      )

    case 'textarea':
      return (
        <FormTextField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
          multiline
          rows={field.rows}
          rules={field.rules}
        />
      )

    case 'select':
      return (
        <FormSelectField
          name={field.name}
          label={field.label}
          options={field.options}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
        />
      )

    case 'radio':
      return (
        <FormRadioField
          name={field.name}
          label={field.label}
          options={field.options}
          required={field.required}
          disabled={field.disabled}
          row={field.row}
        />
      )

    case 'checkbox':
      return (
        <FormCheckboxField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          helperText={field.helperText}
        />
      )

    case 'checkboxGroup':
      return (
        <FormCheckboxField
          name={field.name}
          label={field.label}
          options={field.options}
          required={field.required}
          disabled={field.disabled}
          row={field.row}
          helperText={field.helperText}
        />
      )

    case 'imageUpload':
      return (
        <FormImageUploadField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          maxHeight={field.maxHeight}
        />
      )

    case 'datetime':
      return (
        <FormDateTimeField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
        />
      )

    case 'visibility':
      return (
        <FormVisibilityField
          name={field.name}
          required={field.required}
          disabled={field.disabled}
          characters={field.characters}
          allowHidden={field.allowHidden}
        />
      )

    case 'json':
      return (
        <FormJsonField
          name={field.name}
          label={field.label}
          required={field.required}
          disabled={field.disabled}
          placeholder={field.placeholder}
          helperText={field.helperText}
          minRows={field.minRows}
          maxRows={field.maxRows}
        />
      )

    case 'hidden':
      return <input type="hidden" {...register(field.name)} />
  }
}
